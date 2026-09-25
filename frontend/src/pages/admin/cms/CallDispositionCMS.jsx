import MasterListCMS from '../../../components/MasterListCMS';

const FIELDS = [
  { name: 'name', label: 'Name', type: 'text', required: true },
  { name: 'order', label: 'Order', type: 'number' },
  { name: 'isActive', label: 'Active', type: 'checkbox' },
];

export default function CallDispositionCMS() {
  return (
    <MasterListCMS
      title="Call Disposition Types"
      description="Populates the disposition dropdown in the Log a Call form."
      endpoint="/call-disposition-types"
      listKey="dispositionTypes"
      fields={FIELDS}
    />
  );
}
