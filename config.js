// Detect environment
const isProduction = window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";

// API base URL
const API_BASE_URL = isProduction
  ? "" // In production (Netlify), use relative URLs
  : "http://localhost:3000"; // In development, use local server

// API endpoints configuration
export const API_ENDPOINTS = {
  NOTES: `${API_BASE_URL}/api/notes`,
  NOTE_BY_ID: (id) => `${API_BASE_URL}/api/notes/${id}`,
  OPERATIONS: `${API_BASE_URL}/api/operations`,
  OPERATION_BY_ID: (id) => `${API_BASE_URL}/api/operations/${id}`,
  CLOSE_OPERATION: (id) => `${API_BASE_URL}/api/operations/${id}/close`,
};

// Environment info (useful for debugging)
export const ENV = {
  isProduction,
  apiBaseUrl: API_BASE_URL,
};
