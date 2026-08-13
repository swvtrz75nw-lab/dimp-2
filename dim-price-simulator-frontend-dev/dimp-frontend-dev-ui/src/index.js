// index.js — app configuration derived from environment variables.
// Imported by main.jsx (title) and available to any module that needs runtime config.
export const config = {
  appName: import.meta.env.VITE_APP_NAME || 'Procurement Intel',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  mockLatency: Number(import.meta.env.VITE_MOCK_LATENCY ?? 320),
};

export default config;
