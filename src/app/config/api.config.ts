// API Configuration
// TODO: Move to environment files when implementing production build

export const API_CONFIG = {
  baseUrl: 'http://localhost:8081',
  endpoints: {
    appointments: '/api/v1/appointments',
    assessments: '/api/v1/assessments',
    reports: '/api/v1/reports',
    auth: '/api/v1/auth',
    profiles: '/api/v1/profiles',
  },
};
