import { useEffect, useState } from 'react';
import api from '../api/axios';

// Lightweight client list for populating <select> dropdowns. Server already
// scopes this to the caller's own clients unless they're super_admin.
export default function useClientOptions() {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    api.get('/clients', { params: { limit: 100 } }).then(({ data }) => setClients(data.data)).catch(() => setClients([]));
  }, []);

  return clients;
}
