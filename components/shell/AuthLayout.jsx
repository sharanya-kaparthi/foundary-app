export default function AuthLayout({ children, eyebrow }) {
  return (
    <div className="min-h-screen bg-paper flex flex-col max-w-app mx-auto px-6" style={{ paddingTop: 'max(3rem, env(safe-area-inset-top,0px))', paddingBottom: '2rem' }}>
      <div className="mb-8">
        <div className="w-11 h-11 rounded-xl bg-ink flex items-center justify-center mb-4">
          <span className="font-display text-white text-lg">F</span>
        </div>
        {eyebrow}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
