import * as mock from '../mockData/index.js';
/**
 * Shared API service for chat frontend.
 *
 * Endpoints:
 *   POST /api/dimp-simulator-agent/chat — send message, get SSE streamed response
 *   DELETE /api/dimp-simulator-agent/sessions/:id — clear conversation history
 */
const API_BASE = import.meta.env.VITE_API_MOCK_BASE_URL || '';
const CHAT_ENDPOINT = `${import.meta.env.VITE_API_BASE_URL}/api/dimp-simulator-agent/chat`;
const LATENCY = Number(import.meta.env.VITE_MOCK_LATENCY ?? 320);

/**
 * Send a chat message and stream the SSE response.
 *
 * Uses fetch with readable stream (not EventSource, which only supports GET).
 * Handles partial lines that may split across network chunks.
 *
 * @param {object} opts
 * @param {string} opts.message
 * @param {string} [opts.sessionId]
 * @param {function} opts.onChunk - called with each SSE data payload (string)
 * @returns {Promise<string|null>} - returns session ID from X-Session-Id header
 */
export async function sendChatMessage({ message, sessionId, onChunk }) {
  const response = await fetch(CHAT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    },
    body: JSON.stringify({ message, session_id: sessionId }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Chat API error ${response.status}: ${errorBody}`);
  }

  // Capture session ID from response header
  const returnedSessionId = response.headers.get('X-Session-Id');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE messages are separated by double newlines OR single newlines with data: prefix
    // Handle both formats for compatibility
    const lines = buffer.split('\n');
    buffer = lines.pop(); // last element is either '' or an incomplete line

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data:')) {
        const payload = trimmed.slice(5).trim();
        if (payload) onChunk(payload);
      }
    }
  }

  // Flush any remaining data in buffer
  if (buffer.trim().startsWith('data:')) {
    const payload = buffer.trim().slice(5).trim();
    if (payload) onChunk(payload);
  }

  return returnedSessionId;
}


function settle(value, ms = LATENCY) {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// GET `path` from the API base, or resolve the local fallback when no base is set.
async function get(path, fallback) {
  if (!API_BASE) return settle(fallback);
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`Request failed: ${path} (${res.status})`);
  return res.json();
}

// POST `body` to the API base; in mock mode just echo the body back after a beat.
async function post(path, body) {
  if (!API_BASE) return settle(body, 180);
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Request failed: ${path} (${res.status})`);
  return res.json();
}

// ---- session ----
export const getUser = () => get('/user', mock.USER);
export const updateUser = (user) => post('/user', user);

// ---- navigation / history ----
export const getNavigation = () => get('/navigation', mock.NAV);
export const getRecent = () => get('/recent', mock.RECENT);
export const getHistory = () => get('/history', mock.ALL_HISTORY);

// ---- notifications ----
export const getNotifications = () => get('/notifications', mock.NOTIFICATIONS);
export const getNotificationRules = () => get('/notification-rules', mock.NOTIF_RULES);
export const updateNotificationRule = (rule) => post(`/notification-rules/${rule.id}`, rule);

// ---- usage ----
export const getConsumption = () => get('/consumption', mock.CONSUMPTION);

// ---- chat / analyst content ----
export const getSuggestions = () => get('/suggestions', mock.SUGGESTIONS);
export const getSources = () => get('/sources', mock.SOURCES);
export const getAnalystTemplates = () => get('/analyst/templates', mock.ANALYST_TEMPLATES);

export default {
  getUser, updateUser,
  getNavigation, getRecent, getHistory,
  getNotifications, getNotificationRules, updateNotificationRule,
  getConsumption,
  getSuggestions, getSources, getAnalystTemplates,
};