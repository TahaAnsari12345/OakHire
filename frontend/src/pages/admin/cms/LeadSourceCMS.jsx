import MasterListCMS from '../../../components/MasterListCMS';

const FIELDS = [
  { name: 'name', label: 'Name', type: 'text', required: true },
  { name: 'isActive', label: 'Active', type: 'checkbox' },
];

export default function LeadSourceCMS() {
  return (
    <MasterListCMS
      title="Lead Sources"
      description="Used to tag inbound leads (Stage 7) and candidate source values."
      endpoint="/lead-sources"
      listKey="leadSources"
      fields={FIELDS}
    />
  );
}
