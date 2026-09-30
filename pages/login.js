import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import AuthLayout from '../components/shell/AuthLayout';
import { useAppData } from '../context/AppDataContext';

export default function LoginPage() {
  const router = useRouter();
  const { loginWithEmail } = useAppData();
  const [mode, setMode] = useState('student'); // 'student' | 'custodian' — copy only, redirect always follows the real resolved role
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Supports a direct /login?as=custodian entry point. router.query is empty
  // on the first static render, so this syncs once it's populated — same
  // pattern used for the ?claim= query param on the item detail page.
  useEffect(() => {
    if (router.query.as === 'custodian') setMode('custodian');
  }, [router.query.as]);

  const selectMode = (next) => {
    setMode(next);
    setError('');
    router.replace({ pathname: '/login', query: next === 'custodian' ? { as: 'custodian' } : {} }, undefined, { shallow: true });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const res = await loginWithEmail(email, password);
    setSubmitting(false);
    if (res.ok) {
      // The account's real role decides where it lands — the tab above is
      // just an entry point/copy choice, not an authorization decision.
      router.push(res.role === 'custodian' ? '/custodian' : '/home');
    } else {
      setError(res.error);
    }
  };

  const isCustodian = mode === 'custodian';

  return (
    <AuthLayout
      eyebrow={
        <>
          <h1 className="font-display text-2xl font-semibold text-ink">
            {isCustodian ? 'Trusted Place Login' : 'Welcome to Foundary'}
          </h1>
          <p className="text-sm text-ink-faint mt-1">
            {isCustodian
              ? 'Sign in to manage submissions, custody, and claims at your trusted place.'
              : "Lost something? Found something? We've got you covered."}
          </p>
        </>
      }
    >
      <div className="flex bg-surface p-1 rounded-xl border border-line mb-5 text-xs">
        {['student', 'custodian'].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => selectMode(m)}
            className={`flex-1 py-1.5 rounded-lg font-semibold capitalize ${mode === m ? 'bg-ink text-white' : 'text-ink-faint'}`}
          >
            {m}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-lost-soft text-lost text-xs font-medium px-3 py-2.5 rounded-xl mb-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email">
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email" className="input"
          />
        </Field>
        <Field label="Password">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'} required value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password"
              className="input pr-10"
            />
            <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint" aria-label="Toggle password visibility">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>

        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? 'Signing in…' : 'Log In'}
        </button>
      </form>

      <div className="mt-4 text-center space-y-2">
        <Link href="/forgot-password" className="block text-sm text-ink-soft font-medium">Forgot Password?</Link>
        {isCustodian ? (
          <p className="text-xs text-ink-faint">Credentials are provided by campus management.</p>
        ) : (
          <p className="text-sm text-ink-faint">
            Don't have an account?{' '}
            <Link href="/register" className="text-ink font-semibold">Create Account</Link>
          </p>
        )}
      </div>
    </AuthLayout>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-ink-soft mb-1">{label}</span>
      {children}
    </label>
  );
}
