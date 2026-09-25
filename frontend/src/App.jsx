import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminDashboard from './pages/admin/AdminDashboard';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import CandidateList from './pages/candidates/CandidateList';
import CandidateForm from './pages/candidates/CandidateForm';
import CandidateDetail from './pages/candidates/CandidateDetail';
import ClientList from './pages/clients/ClientList';
import ClientForm from './pages/clients/ClientForm';
import ClientDetail from './pages/clients/ClientDetail';
import JobRequirementList from './pages/jobRequirements/JobRequirementList';
import JobRequirementForm from './pages/jobRequirements/JobRequirementForm';
import ApplicationList from './pages/applications/ApplicationList';
import ApplicationForm from './pages/applications/ApplicationForm';
import ApplicationDetail from './pages/applications/ApplicationDetail';
import ComplianceReport from './pages/admin/ComplianceReport';
import CallLogList from './pages/admin/CallLogList';
import EmployeeList from './pages/admin/EmployeeList';
import EmployeeProfile from './pages/admin/EmployeeProfile';
import TransferTool from './pages/admin/TransferTool';
import FunnelStageCMS from './pages/admin/cms/FunnelStageCMS';
import CallDispositionCMS from './pages/admin/cms/CallDispositionCMS';
import LeadSourceCMS from './pages/admin/cms/LeadSourceCMS';

function RoleHome() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'super_admin' ? '/admin' : '/app'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['employee']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/app" element={<EmployeeDashboard />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/candidates" element={<CandidateList />} />
          <Route path="/candidates/new" element={<CandidateForm />} />
          <Route path="/candidates/:id" element={<CandidateDetail />} />
          <Route path="/candidates/:id/edit" element={<CandidateForm />} />

          <Route path="/clients" element={<ClientList />} />
          <Route path="/clients/new" element={<ClientForm />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route path="/clients/:id/edit" element={<ClientForm />} />

          <Route path="/job-requirements" element={<JobRequirementList />} />
          <Route path="/job-requirements/new" element={<JobRequirementForm />} />
          <Route path="/job-requirements/:id" element={<JobRequirementForm />} />

          <Route path="/applications" element={<ApplicationList />} />
          <Route path="/applications/new" element={<ApplicationForm />} />
          <Route path="/applications/:id" element={<ApplicationDetail />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin/compliance" element={<ComplianceReport />} />
          <Route path="/admin/call-logs" element={<CallLogList />} />
          <Route path="/admin/employees" element={<EmployeeList />} />
          <Route path="/admin/employees/:id" element={<EmployeeProfile />} />
          <Route path="/admin/transfer" element={<TransferTool />} />
          <Route path="/admin/cms/funnel-stages" element={<FunnelStageCMS />} />
          <Route path="/admin/cms/call-dispositions" element={<CallDispositionCMS />} />
          <Route path="/admin/cms/lead-sources" element={<LeadSourceCMS />} />
        </Route>
      </Route>

      <Route path="/" element={<RoleHome />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
