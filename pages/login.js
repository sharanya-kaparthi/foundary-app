import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import AuthLayout from '../components/shell/AuthLayout';
import { useAppData } from '../context/AppDataContext';

export default function LoginPage() {
  const router = useRouter();
  const { loginWithEmail } = useAppData();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const res = await loginWithEmail(email, password);
    setSubmitting(false);
    if (res.ok) {
      router.push('/home');
    } else {
      setError(res.error);
    }
  };

  return (
    <AuthLayout
      eyebrow={
        <>
          <h1 className="font-display text-2xl font-semibold text-ink">Welcome to Foundary</h1>
          <p className="text-sm text-ink-faint mt-1">Lost something? Found something? We've got you covered.</p>
        </>
      }
    >
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
        <Link href="/forgot-password" className="text-sm text-ink-soft font-medium">Forgot Password?</Link>
        <p className="text-sm text-ink-faint">
          Don't have an account?{' '}
          <Link href="/register" className="text-ink font-semibold">Create Account</Link>
        </p>
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
