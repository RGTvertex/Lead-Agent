import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token'); localStorage.removeItem('user');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

export const authAPI = {
  login: (d: { email: string; password: string }) => api.post('/auth/login', d),
  register: (d: any) => api.post('/auth/register', d),
  me: () => api.get('/auth/me'),
};

export const dashboardAPI = { get: () => api.get('/dashboard/') };
export const companiesAPI = {
  list: (p?: any) => api.get('/companies/', { params: p }),
  get: (id: string) => api.get(`/companies/${id}`),
  create: (d: any) => api.post('/companies/', d),
  update: (id: string, d: any) => api.put(`/companies/${id}`, d),
  delete: (id: string) => api.delete(`/companies/${id}`),
  industries: () => api.get('/companies/industries/list'),
};
export const contactsAPI = {
  list: (p?: any) => api.get('/contacts/', { params: p }),
  create: (d: any) => api.post('/contacts/', d),
  update: (id: string, d: any) => api.put(`/contacts/${id}`, d),
  delete: (id: string) => api.delete(`/contacts/${id}`),
};
export const leadsAPI = {
  list: (p?: any) => api.get('/leads/', { params: p }),
  create: (d: any) => api.post('/leads/', d),
  update: (id: string, d: any) => api.put(`/leads/${id}`, d),
  delete: (id: string) => api.delete(`/leads/${id}`),
};
export const tasksAPI = {
  list: (p?: any) => api.get('/tasks', { params: p }),
  today: () => api.get('/tasks/today'),
  create: (d: any) => api.post('/tasks', d),
  update: (id: string, d: any) => api.put(`/tasks/${id}`, d),
  delete: (id: string) => api.delete(`/tasks/${id}`),
};
export const notesAPI = {
  list: (p?: any) => api.get('/notes', { params: p }),
  create: (d: any) => api.post('/notes', d),
  delete: (id: string) => api.delete(`/notes/${id}`),
};
export const activitiesAPI = { list: (p?: any) => api.get('/activities/', { params: p }) };
export const usersAPI = {
  list: (p?: any) => api.get('/users/', { params: p }),
  create: (d: any) => api.post('/users/', d),
  update: (id: string, d: any) => api.put(`/users/${id}`, d),
  delete: (id: string) => api.delete(`/users/${id}`),
};
export const reportsAPI = {
  companies: () => api.get('/reports/companies/csv', { responseType: 'blob' }),
  leads: (p?: any) => api.get('/reports/leads/csv', { params: p, responseType: 'blob' }),
  tasks: () => api.get('/reports/tasks/csv', { responseType: 'blob' }),
};
