import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import AuthLayout from '../components/shell/AuthLayout';
import { useAppData } from '../context/AppDataContext';

export default function RegisterPage() {
  const router = useRouter();
  const { registerWithEmail } = useAppData();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Please enter your name.';
    if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = 'Please enter a valid email.';
    if (password.length < 6) errs.password = 'Password must be at least 6 characters.';
    if (password !== confirm) errs.confirm = 'Passwords do not match.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setSubmitting(true);
    const res = await registerWithEmail(name.trim(), email, password);
    setSubmitting(false);
    if (res.ok) {
      router.push('/home');
    } else {
      setError(res.error);
    }
  };

  return (
    <AuthLayout
      eyebrow={<h1 className="font-display text-2xl font-semibold text-ink">Create your Foundary account</h1>}
    >
      {error && (
        <div className="flex items-center gap-2 bg-lost-soft text-lost text-xs font-medium px-3 py-2.5 rounded-xl mb-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Full Name" error={fieldErrors.name}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" className="input" />
        </Field>
        <Field label="Email" error={fieldErrors.email}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="input" />
        </Field>
        <Field label="Password" error={fieldErrors.password}>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'} value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" className="input pr-10"
            />
            <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint" aria-label="Toggle password visibility">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>
        <Field label="Confirm Password" error={fieldErrors.confirm}>
          <input
            type={showPassword ? 'text' : 'password'} value={confirm}
            onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter your password" className="input"
          />
        </Field>

        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-ink-faint">
        Already have an account?{' '}
        <Link href="/login" className="text-ink font-semibold">Log In</Link>
      </p>
    </AuthLayout>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-ink-soft mb-1">{label}</span>
      {children}
      {error && <span className="block text-[11px] text-lost mt-1">{error}</span>}
    </label>
  );
}
