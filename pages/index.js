import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAppData } from '../context/AppDataContext';
import Spinner from '../components/ui/Spinner';

export default function Home() {
  const router = useRouter();
  const { user, userRole, authLoading } = useAppData();

  useEffect(() => {
    if (authLoading) return;
    const isRealUser = user && !user.isAnonymous;
    if (!isRealUser) {
      router.replace('/login');
    } else {
      router.replace(userRole === 'custodian' ? '/custodian' : '/home');
    }
  }, [authLoading, user, userRole, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper">
      <Spinner label="Loading Foundary…" />
    </div>
  );
}
