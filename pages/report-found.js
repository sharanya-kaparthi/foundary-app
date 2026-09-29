import AppShell from '../components/shell/AppShell';
import Protected from '../components/shell/Protected';
import ReportItemForm from '../components/forms/ReportItemForm';

export default function ReportFoundPage() {
  return (
    <Protected>
      <AppShell back="/home" title="Report Found Item">
        <ReportItemForm type="found" />
      </AppShell>
    </Protected>
  );
}
