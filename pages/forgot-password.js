import { useState } from 'react';
import Link from 'next/link';
import AuthLayout from '../components/shell/AuthLayout';
import { useAppData } from '../context/AppDataContext';

export default function ForgotPasswordPage() {
  const { sendResetEmail } = useAppData();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await sendResetEmail(email);
    setSubmitting(false);
    setSent(true);
  };

  return (
    <AuthLayout
      eyebrow={
        <>
          <h1 className="font-display text-2xl font-semibold text-ink">Reset your password</h1>
          <p className="text-sm text-ink-faint mt-1">Enter your email and we'll send you instructions to reset your password.</p>
        </>
      }
    >
      {sent ? (
        <div className="bg-found-soft text-found text-sm font-medium px-3 py-3 rounded-xl">
          If an account exists for this email, password reset instructions have been sent.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="block text-xs font-semibold text-ink-soft mb-1">Email</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="input" />
          </label>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Sending…' : 'Send Reset Link'}
          </button>
        </form>
      )}

      <p className="mt-4 text-center text-sm">
        <Link href="/login" className="text-ink-soft font-medium">Back to Login</Link>
      </p>
    </AuthLayout>
  );
}
