import MasterListCMS from '../../../components/MasterListCMS';

const FIELDS = [
  { name: 'name', label: 'Name', type: 'text', required: true },
  { name: 'order', label: 'Order', type: 'number' },
  { name: 'isTerminal', label: 'Terminal stage', type: 'checkbox' },
  { name: 'isActive', label: 'Active', type: 'checkbox' },
];

export default function FunnelStageCMS() {
  return (
    <MasterListCMS
      title="Funnel Stages"
      description="Controls the stage dropdown everywhere in the app, and which stages skip the mandatory next-follow-up rule."
      endpoint="/funnel-stages"
      listKey="stages"
      fields={FIELDS}
    />
  );
}
