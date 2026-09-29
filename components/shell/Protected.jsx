import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAppData } from '../../context/AppDataContext';
import Spinner from '../ui/Spinner';

// Wraps a page. Redirects to /login if there's no real (non-anonymous) user,
// and to /home if a `role` requirement isn't met. Keeps the check declarative
// so every protected page reads the same at a glance.
export default function Protected({ children, role }) {
  const router = useRouter();
  const { user, userRole, authLoading } = useAppData();
  const isRealUser = user && !user.isAnonymous;

  useEffect(() => {
    if (authLoading) return;
    if (!isRealUser) {
      router.replace('/login');
      return;
    }
    if (role && userRole !== role) {
      router.replace(userRole === 'custodian' ? '/custodian' : '/home');
    }
  }, [authLoading, isRealUser, role, userRole, router]);

  if (authLoading || !isRealUser || (role && userRole !== role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <Spinner label="Loading Foundary…" />
      </div>
    );
  }

  return children;
}
