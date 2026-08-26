// Dynamic API Base URL for Local & Production Deployments (Vercel, Render, Railway, etc.)
export const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000');
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000');
