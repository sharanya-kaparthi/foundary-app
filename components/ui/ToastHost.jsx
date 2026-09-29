import { useEffect } from 'react';
import { useAppData } from '../../context/AppDataContext';

export default function ToastHost() {
  const { toast, dismissToast } = useAppData();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(dismissToast, 2600);
    return () => clearTimeout(t);
  }, [toast, dismissToast]);

  if (!toast) return null;

  return (
    <div className="fixed left-0 right-0 bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] z-[60] flex justify-center px-4 pointer-events-none">
      <div className="bg-ink text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-card max-w-[90%] truncate">
        {toast.message}
      </div>
    </div>
  );
}
