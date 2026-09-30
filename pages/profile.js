import { useState } from 'react';
import { useRouter } from 'next/router';
import { User, Bell, Moon, HelpCircle, Trash2, LogOut, ChevronRight, ShieldCheck } from 'lucide-react';
import AppShell from '../components/shell/AppShell';
import Protected from '../components/shell/Protected';
import Modal from '../components/ui/Modal';
import IssuesAndComplaints from '../components/issues/IssuesAndComplaints';
import ConfirmModal from '../components/ui/ConfirmModal';
import { useAppData } from '../context/AppDataContext';

function ProfileContent() {
  const router = useRouter();
  const { user, userRole, handleSignOut, deleteAccount, showToast } = useAppData();
  const [showHelp, setShowHelp] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const name = (user?.displayName || 'Campus Member').split(' [')[0];

  const onDeleteAccount = async () => {
    setDeleting(true);
    const res = await deleteAccount();
    setDeleting(false);
    if (res.ok) {
      router.push('/login');
    } else {
      showToast(res.error);
      setShowDeleteAccount(false);
    }
  };

  return (
    <AppShell back="/home" title="Profile">
      <div className="bg-surface border border-line rounded-2xl p-4 shadow-card flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-full bg-ink text-white flex items-center justify-center font-display font-semibold text-lg flex-shrink-0">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-display font-semibold text-ink truncate">{name}</p>
          <p className="text-xs text-ink-faint truncate">{user?.email || '—'}</p>
          <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${userRole === 'custodian' ? 'bg-brass-soft text-brass' : 'bg-found-soft text-found'}`}>
            {userRole}
          </span>
        </div>
      </div>

      {userRole === 'custodian' && (
        <button
          onClick={() => router.push('/custodian')}
          className="w-full flex items-center justify-between p-3.5 rounded-xl bg-brass-soft text-brass font-semibold text-sm mb-3"
        >
          <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Open Trusted Place Desk</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      <IssuesAndComplaints />

      <div className="bg-surface border border-line rounded-2xl divide-y divide-line overflow-hidden mb-5">
        <SettingRow icon={User} label="Account" onClick={() => showToast('Account settings coming soon.')} />
        <SettingRow icon={Bell} label="Notifications" onClick={() => router.push('/notifications')} />
        <SettingRow icon={Moon} label="Appearance" trailing="Coming soon" onClick={() => showToast('Dark mode is coming soon.')} />
        <SettingRow icon={HelpCircle} label="Help" onClick={() => setShowHelp(true)} />
        <SettingRow icon={Trash2} label="Delete Account" tone="lost" onClick={() => setShowDeleteAccount(true)} />
      </div>

      <button
        onClick={() => { handleSignOut(); router.push('/login'); }}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-line text-ink-soft font-semibold text-sm"
      >
        <LogOut className="w-4 h-4" /> Log Out
      </button>

      <Modal open={showHelp} onClose={() => setShowHelp(false)} title="Help">
        <p className="text-sm text-ink-soft leading-relaxed">
          For help with a lost or found item, use Report an Issue from the item's page. For anything else, reach out to your campus administration office.
        </p>
      </Modal>

      <ConfirmModal
        open={showDeleteAccount}
        onClose={() => setShowDeleteAccount(false)}
        onConfirm={onDeleteAccount}
        loading={deleting}
        destructive
        title="Delete Account"
        message="Deleting your account will remove your account access and may permanently remove eligible personal records. Active Lost & Found records may need to be resolved first."
        confirmLabel="Delete Account"
      />
    </AppShell>
  );
}

function SettingRow({ icon: Icon, label, onClick, tone, trailing }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between p-3.5 text-sm ${tone === 'lost' ? 'text-lost' : 'text-ink'}`}>
      <span className="flex items-center gap-2.5 font-medium">
        <Icon className="w-4 h-4" /> {label}
      </span>
      <span className="flex items-center gap-1 text-ink-faint">
        {trailing && <span className="text-[10px]">{trailing}</span>}
        <ChevronRight className="w-4 h-4" />
      </span>
    </button>
  );
}

export default function ProfilePage() {
  return (
    <Protected>
      <ProfileContent />
    </Protected>
  );
}
