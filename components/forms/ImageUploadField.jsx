import { useRef, useState, useEffect } from 'react';
import { Camera, Image as ImageIcon, X, Sparkles } from 'lucide-react';
import Modal from '../ui/Modal';
import { useAppData } from '../../context/AppDataContext';

const STAGES = [
  'Understanding your description',
  'Identifying item characteristics',
  'Comparing possible matches',
  'Checking location and date'
];

export default function ImageUploadField({ value, onChange, onAnalyzed, required = false }) {
  const { triggerAiAnalysis } = useAppData();
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [showSourceSheet, setShowSourceSheet] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [suggestions, setSuggestions] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!analyzing) return;
    const t = setInterval(() => setStageIndex((i) => Math.min(i + 1, STAGES.length - 1)), 900);
    return () => clearInterval(t);
  }, [analyzing]);

  const runAnalysis = async (base64) => {
    setAnalyzing(true);
    setStageIndex(0);
    setFailed(false);
    try {
      const parsed = await triggerAiAnalysis(base64);
      setSuggestions(parsed);
      onAnalyzed?.(parsed);
    } catch {
      setFailed(true);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      onChange(reader.result);
      runAnalysis(reader.result);
    };
    reader.readAsDataURL(file);
    setShowSourceSheet(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-ink-soft">Item Photo</label>
        {!required && <span className="text-[10px] px-1.5 py-0.5 rounded bg-line/70 text-ink-faint font-medium">Optional</span>}
      </div>

      <div className="border-2 border-dashed border-line rounded-xl p-4 text-center bg-surface/60">
        {value ? (
          <div className="relative inline-block">
            <img src={value} alt="Selected item preview" className="max-h-40 mx-auto rounded-lg object-contain" />
            <div className="absolute -top-2 -right-2 flex gap-1">
              <button
                type="button"
                onClick={() => setShowSourceSheet(true)}
                className="bg-ink text-white text-[10px] font-semibold px-2 py-1 rounded-full focus-ring"
              >
                Change
              </button>
              <button
                type="button"
                onClick={() => { onChange(''); setSuggestions(null); }}
                aria-label="Remove photo"
                className="bg-surface border border-line p-1 rounded-full text-ink-soft focus-ring"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setShowSourceSheet(true)} className="flex flex-col items-center py-2 w-full focus-ring rounded-lg">
            <Camera className="w-7 h-7 text-ink-faint mb-1.5" strokeWidth={1.5} />
            <span className="text-xs text-ink font-medium">Add a photo</span>
            <span className="text-[10px] text-ink-faint mt-0.5">A clear photo can improve matching.</span>
          </button>
        )}

        {analyzing && (
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-brass font-medium">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>{STAGES[stageIndex]}…</span>
          </div>
        )}

        {failed && (
          <div className="mt-3 text-xs text-lost">
            We couldn't complete AI analysis right now. Your report has still been saved.{' '}
            <button type="button" onClick={() => runAnalysis(value)} className="underline font-semibold">Try Again</button>
          </div>
        )}

        {suggestions && !analyzing && (
          <div className="mt-3 bg-brass-soft text-left p-2.5 rounded-xl text-xs space-y-0.5">
            <p className="font-semibold text-brass flex items-center gap-1"><Sparkles className="w-3 h-3" /> Analysis complete</p>
            <p className="text-ink-soft"><span className="text-ink-faint">Category:</span> {suggestions.category}</p>
            <p className="text-ink-soft"><span className="text-ink-faint">Color:</span> {suggestions.estimatedColor}</p>
            <p className="text-ink-soft"><span className="text-ink-faint">Features:</span> {suggestions.keyFeatures}</p>
          </div>
        )}
      </div>

      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
      <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

      <Modal open={showSourceSheet} onClose={() => setShowSourceSheet(false)} variant="sheet" title="Add a photo">
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-line text-left focus-ring"
          >
            <Camera className="w-5 h-5 text-ink-soft" />
            <span className="text-sm font-medium text-ink">Take Photo</span>
          </button>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-line text-left focus-ring"
          >
            <ImageIcon className="w-5 h-5 text-ink-soft" />
            <span className="text-sm font-medium text-ink">Choose from Gallery</span>
          </button>
          <button type="button" onClick={() => setShowSourceSheet(false)} className="w-full text-center text-sm text-ink-faint py-2">
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}
