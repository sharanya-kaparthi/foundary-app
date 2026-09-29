import AppShell from '../components/shell/AppShell';
import Protected from '../components/shell/Protected';
import ReportItemForm from '../components/forms/ReportItemForm';

export default function ReportLostPage() {
  return (
    <Protected>
      <AppShell back="/home" title="Report Lost Item">
        <ReportItemForm type="lost" />
      </AppShell>
    </Protected>
  );
}
