/**
 * Inflation Dashboard API Service
 *
 * Integrates with:
 *   GET /api/inflation-data-dashboard-service/v1/health        — liveness probe
 *   GET /api/inflation-data-dashboard-service/v1/dashboard     — full dashboard data (filtered)
 *   GET /api/inflation-data-dashboard-service/v1/filters       — available filter dropdown values
 *   GET /api/inflation-data-dashboard-service/v1/price-indices — macro price index rates
 *   CRUD /api/inflation-data-dashboard-service/v1/saved-filters — saved filter presets
 *
 * All data comes from the backend — no mock data fallback.
 */

const INFLATION_API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const API_PREFIX = '/api/inflation-data-dashboard-service/v1';

/**
 * Build the full URL for an API path with optional query params.
 */
function buildUrl(path, params) {
  const qs = params ? params.toString() : '';
  return `${INFLATION_API_BASE}${API_PREFIX}${path}${qs ? '?' + qs : ''}`;
}

/**
 * Shared fetch wrapper with proper error handling per the integration guide:
 *   404 = no rows matched (empty state, not error)
 *   503 = data still loading on backend (retry/loading state)
 */
async function apiFetch(url) {
  if (!INFLATION_API_BASE) {
    throw new Error('VITE_API_BASE_URL is not configured. Set it in .env to connect to the backend.');
  }

  const res = await fetch(url);

  if (res.status === 404) {
    // No data matched filters — return null so UI can show empty state
    return null;
  }
  if (res.status === 503) {
    throw new Error('SERVICE_UNAVAILABLE: Data is still loading on the backend. Please retry.');
  }
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// ─── Health Check ───────────────────────────────────────────────────────────────

/**
 * Check backend health/liveness.
 * @returns {Promise<{status: string}>}
 */
export async function fetchHealth() {
  return apiFetch(buildUrl('/health'));
}

// ─── Dashboard ──────────────────────────────────────────────────────────────────

/**
 * Fetch full dashboard data with optional filters.
 * Filters are AND between dimensions, OR within a dimension.
 * Multi-value params are repeated: ?team=A&team=B
 *
 * @param {object} filters
 * @param {number} [filters.year]
 * @param {string[]} [filters.ims_market]
 * @param {string[]} [filters.ims_market_region]
 * @param {string[]} [filters.vendor_country]
 * @param {string[]} [filters.vendor_region]
 * @param {string[]} [filters.team]
 * @param {string[]} [filters.category_l2]
 * @param {string[]} [filters.category_l3]
 * @param {string} [filters.hyper_split]
 * @returns {Promise<object|null>} Dashboard response or null if no data matches
 */
export async function fetchDashboard(filters = {}) {
  const params = new URLSearchParams();

  if (filters.year) params.append('year', filters.year);
  if (filters.ims_market) filters.ims_market.forEach((v) => params.append('ims_market', v));
  if (filters.ims_market_region) filters.ims_market_region.forEach((v) => params.append('ims_market_region', v));
  if (filters.vendor_country) filters.vendor_country.forEach((v) => params.append('vendor_country', v));
  if (filters.vendor_region) filters.vendor_region.forEach((v) => params.append('vendor_region', v));
  if (filters.team) filters.team.forEach((v) => params.append('team', v));
  if (filters.category_l2) filters.category_l2.forEach((v) => params.append('category_l2', v));
  if (filters.category_l3) filters.category_l3.forEach((v) => params.append('category_l3', v));
  if (filters.hyper_split) params.append('hyper_split', filters.hyper_split);

  return apiFetch(buildUrl('/dashboard', params));
}

// ─── Filters ────────────────────────────────────────────────────────────────────

/**
 * Fetch available filter options for dropdowns.
 * Call once on app load — returns arrays for year, ims_market, ims_market_region,
 * vendor_country, vendor_region, team, category_l2, category_l3, hyper_split.
 *
 * @returns {Promise<object>} Filter options
 */
export async function fetchFilters() {
  return apiFetch(buildUrl('/filters'));
}

// ─── Price Indices ──────────────────────────────────────────────────────────────

/**
 * Fetch macro price index rates (Best/Base/Upside per index family per year).
 * Independent of the main filter bar — used for the macro-rate reference panel.
 *
 * @param {number} [year] - Optional year filter
 * @returns {Promise<object>} Price index data
 */
export async function fetchPriceIndices(year) {
  const params = new URLSearchParams();
  if (year) params.append('year', year);
  return apiFetch(buildUrl('/price-indices', params));
}

// ─── Saved Filters (per user_id) ────────────────────────────────────────────────

/**
 * List all saved filter presets for a user.
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export async function listSavedFilters(userId) {
  const params = new URLSearchParams();
  params.append('user_id', userId);
  return apiFetch(buildUrl('/saved-filters', params));
}

/**
 * Get a single saved filter preset.
 * @param {string} filterId
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
export async function getSavedFilter(filterId, userId) {
  const params = new URLSearchParams();
  params.append('user_id', userId);
  return apiFetch(buildUrl(`/saved-filters/${filterId}`, params));
}

/**
 * Create a new saved filter preset.
 * Store the exact /dashboard query-param object as `filters`.
 *
 * @param {string} userId
 * @param {string} filterName
 * @param {object} filters - The filter payload (year, team, category_l2, etc.)
 * @returns {Promise<object>}
 */
export async function createSavedFilter(userId, filterName, filters) {
  if (!INFLATION_API_BASE) {
    throw new Error('VITE_API_BASE_URL is not configured.');
  }
  const url = buildUrl('/saved-filters');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, filter_name: filterName, filters }),
  });
  if (!res.ok) throw new Error(`Create saved filter failed: ${res.status}`);
  return res.json();
}

/**
 * Update an existing saved filter preset.
 * @param {string} filterId
 * @param {string} userId
 * @param {string} [filterName]
 * @param {object} [filters]
 * @returns {Promise<object>}
 */
export async function updateSavedFilter(filterId, userId, filterName, filters) {
  if (!INFLATION_API_BASE) {
    throw new Error('VITE_API_BASE_URL is not configured.');
  }
  const url = buildUrl(`/saved-filters/${filterId}`);
  const body = { user_id: userId };
  if (filterName !== undefined) body.filter_name = filterName;
  if (filters !== undefined) body.filters = filters;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Update saved filter failed: ${res.status}`);
  return res.json();
}

/**
 * Delete a saved filter preset.
 * @param {string} filterId
 * @param {string} userId
 * @returns {Promise<void>}
 */
export async function deleteSavedFilter(filterId, userId) {
  if (!INFLATION_API_BASE) {
    throw new Error('VITE_API_BASE_URL is not configured.');
  }
  const params = new URLSearchParams();
  params.append('user_id', userId);
  const url = buildUrl(`/saved-filters/${filterId}`, params);
  const res = await fetch(url, { method: 'DELETE' });
  if (res.status === 404) throw new Error('Saved filter not found.');
  if (!res.ok) throw new Error(`Delete saved filter failed: ${res.status}`);
}
