// mockData/navigation.js — sidebar nav, recent conversations, full history
export const NAV = [
  { id: 'home', icon: 'home', label: 'Command Center', path: '/home' },
  { id: 'chat', icon: 'star4', label: 'ProcureAI', path: '/' },

  { section: 'Forecast' },
  { id: 'dim', icon: 'trending', label: 'Material Price', path: '/material-price' },
  { id: 'inflation', icon: 'inflation', label: 'Inflation', path: '/inflation' },
  { id: 'equipment', icon: 'equipment', label: 'Equipment', path: '/equipment' },
  { section: 'Platforms' },
  { id: 'pdca', icon: 'pdca', label: 'PDCA Reporting', path: '/pdca-reporting' },
  { id: 'indexlibrary', icon: 'database', label: 'Index Library', path: '/index-library' },
  // { id: 'modelcards', icon: 'wand', label: 'Model Cards - Logic Studio', path: '/model-cards' },
  { id: 'category-management', icon: 'layers', label: 'Category Management', path: '/category-management' },
  { id: 'supplier', icon: 'supplier', label: 'Supplier 360', path: '/supplier-360' },
  { id: 'admin', icon: 'settings', label: 'Admin Center', path: '/admin' },
  { id: 'sandbox', icon: 'flask', label: 'Sandbox', path: '/sandbox', comingSoon: true },
  { section: 'Expansion Modules' },
  { id: 'spend', icon: 'spend', label: 'Spend Analytics', path: '/spend-analytics', comingSoon: true },
  { id: 'contract', icon: 'file', label: 'Contract Intelligence', path: '/contract-intelligence', comingSoon: true },
  { id: 'sourcing', icon: 'search', label: 'Sourcing Intelligence', path: '/sourcing-intelligence', comingSoon: true },
];

export const RECENT = [
  { id: 'r1', title: 'Q3 acetate tow price exposure vs. hedge' },
  { id: 'r2', title: 'EUR/USD swing impact on DIM landed cost' },
  { id: 'r3', title: 'Filter-maker CAPEX payback — 2026 lines' },
];

export const ALL_HISTORY = [
  ...RECENT.map((r) => ({ ...r, when: 'Today' })),
  { id: 'h4', title: 'Plug wrap supplier consolidation scenarios', when: 'Yesterday' },
  { id: 'h5', title: 'Spare-parts inflation forecast — converting fleet', when: 'Yesterday' },
  { id: 'h6', title: 'EU vs APAC tipping-paper price gap', when: 'This week' },
  { id: 'h7', title: 'What-if: 200bps rate shock on landed cost', when: 'This week' },
  { id: 'h8', title: 'Acetate tow — 3-year hedge ladder review', when: 'Last week' },
];
