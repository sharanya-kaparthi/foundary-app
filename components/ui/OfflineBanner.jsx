import { useAppData } from '../../context/AppDataContext';

export default function OfflineBanner() {
  const { isOnline } = useAppData();
  if (isOnline) return null;
  return (
    <div className="bg-brass text-white text-xs font-medium px-4 py-2 text-center">
      You're offline — some Foundary features may be unavailable until you're connected again.
    </div>
  );
}
