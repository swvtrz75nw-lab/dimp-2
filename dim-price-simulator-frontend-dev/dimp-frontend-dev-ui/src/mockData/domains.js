// mockData/domains.js — content for the Domain and Platform shell pages.
// Card tuples: [label, value, delta, deltaUp, icon, color]
export const DOMAIN_META = {
  dim: {
    kicker: 'Domain', title: 'DIM Price',
    sub: 'Direct input material pricing across the portfolio — spend, indices and budget variance.',
    cards: [
      ['Total DIM spend', '$418.2M', '+4.8% vs budget', true, 'trending', 'var(--pmi-blue)'],
      ['Top mover', 'Acetate tow', '+11.4% YoY', true, 'inflation', 'var(--pmi-magenta)'],
      ['Materials tracked', '42', 'full coverage', false, 'layers', 'var(--pmi-teal)'],
      ['Over-budget lines', '2', '$19.2M exposure', true, 'alert', 'var(--c-orange)'],
    ],
  },
  inflation: {
    kicker: 'Domain', title: 'Inflation',
    sub: 'Inflation pass-through and currency exposure on landed cost.',
    cards: [
      ['Composite inflation', '+6.8%', '24-mo trend', true, 'inflation', 'var(--pmi-magenta)'],
      ['EUR / USD', '1.084', '−1.8% today', false, 'gauge', 'var(--pmi-blue)'],
      ['Pass-through risk', 'High', 'top supplier tier', true, 'alert', 'var(--c-orange)'],
      ['FX-exposed spend', '$212M', '51% of DIM', false, 'layers', 'var(--pmi-teal)'],
    ],
  },
  equipment: {
    kicker: 'Domain', title: 'Equipment',
    sub: 'Capital equipment pricing, CAPEX quotes and spare-parts inflation.',
    cards: [
      ['Equipment index', '+2.1%', 'vs last quarter', true, 'equipment', 'var(--pmi-teal)'],
      ['Open CAPEX quotes', '7', '3 vendors', false, 'cube', 'var(--pmi-blue)'],
      ['Spares inflation', '+3.4%', '2026 forecast', true, 'inflation', 'var(--pmi-magenta)'],
      ['Best payback', '2.4 yrs', 'maker-line A', false, 'gauge', 'var(--c-green)'],
    ],
  },
};

// Phase tuples: [label, value, color]
export const PLATFORM_META = {
  pdca: {
    kicker: 'Platform', title: 'PDCA Reporting',
    sub: 'Plan–Do–Check–Act continuous-improvement boards for the procurement organisation.',
    phases: [
      ['Plan', '3 active', 'var(--pmi-blue)'], ['Do', '5 active', 'var(--pmi-magenta)'],
      ['Check', '2 review', 'var(--pmi-teal)'], ['Act', '1 closing', 'var(--c-green)'],
    ],
  },
  supplier: {
    kicker: 'Platform', title: 'Supplier 360',
    sub: 'A consolidated view of supplier performance, risk and spend concentration.',
    phases: [
      ['Suppliers', '318', 'var(--pmi-blue)'], ['At risk', '12', 'var(--c-orange)'],
      ['Single-source', '7', 'var(--c-red)'], ['On contract', '94%', 'var(--pmi-teal)'],
    ],
  },
  admin: {
    kicker: 'Platform', title: 'Admin Center',
    sub: 'Manage users, roles, data connectors and platform configuration for the procurement organisation.',
    phases: [
      ['Active users', '146', 'var(--pmi-blue)'], ['Roles', '8', 'var(--pmi-magenta)'],
      ['Data connectors', '12', 'var(--pmi-teal)'], ['Pending invites', '3', 'var(--c-orange)'],
    ],
  },
};
