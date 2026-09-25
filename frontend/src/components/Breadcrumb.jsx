import { Link, useLocation } from 'react-router-dom';
import { useBreadcrumbLabel } from '../context/BreadcrumbContext';

const SEGMENT_LABELS = {
  admin: 'Admin',
  app: 'Dashboard',
  candidates: 'Candidates',
  clients: 'Clients',
  'job-requirements': 'Job Requirements',
  applications: 'Applications',
  employees: 'Employees',
  transfer: 'Transfer',
  compliance: 'Follow-up Compliance',
  'call-logs': 'Call Logs',
  cms: 'CMS',
  'funnel-stages': 'Funnel Stages',
  'call-dispositions': 'Call Dispositions',
  'lead-sources': 'Lead Sources',
  new: 'New',
  edit: 'Edit',
};

const MONGO_ID = /^[a-f\d]{24}$/i;

export default function Breadcrumb() {
  const { pathname } = useLocation();
  const dynamicLabel = useBreadcrumbLabel();

  const segments = pathname.split('/').filter(Boolean);
  const crumbs = [];
  let path = '';

  segments.forEach((segment, index) => {
    path += `/${segment}`;
    const isLast = index === segments.length - 1;
    if (MONGO_ID.test(segment)) {
      crumbs.push({ label: dynamicLabel || 'Details', path, isLast });
    } else {
      crumbs.push({ label: SEGMENT_LABELS[segment] || segment, path, isLast });
    }
  });

  if (crumbs.length === 0) return <span className="breadcrumb-root">OakHire CRM</span>;

  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {crumbs.map((crumb, i) => (
        <span key={crumb.path}>
          {i > 0 && <span className="breadcrumb-sep">/</span>}
          {crumb.isLast ? (
            <span className="breadcrumb-current">{crumb.label}</span>
          ) : (
            <Link to={crumb.path}>{crumb.label}</Link>
          )}
        </span>
      ))}
    </nav>
  );
}
