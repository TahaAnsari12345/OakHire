import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

// Only super_admin can list users (server-enforced); this hook is a no-op
// for employees so assignment dropdowns stay empty/hidden for them.
export default function useEmployees() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    if (user?.role !== 'super_admin') return;
    api.get('/users').then(({ data }) => setEmployees(data.users)).catch(() => setEmployees([]));
  }, [user]);

  return employees;
}
