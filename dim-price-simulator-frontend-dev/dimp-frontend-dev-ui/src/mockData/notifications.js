// mockData/notifications.js — notification feed + notification rules
export const NOTIFICATIONS = [
  { id: 'n1', urgency: 'high', icon: 'alert', title: 'Acetate tow price breach', body: 'Composite index crossed the +10% YoY alert threshold you set.', time: '12m ago' },
  { id: 'n2', urgency: 'high', icon: 'zap', title: 'EUR/USD moved 1.8% today', body: 'Landed-cost forecast for the EU cluster updated automatically.', time: '1h ago' },
  { id: 'n3', urgency: 'med', icon: 'trending', title: 'Tipping paper tender closing', body: 'Q4 commitment window closes in 3 days.', time: '4h ago' },
  { id: 'n4', urgency: 'med', icon: 'file', title: 'Analyst report shared with you', body: '“Filter-maker CAPEX payback — 2026 lines” by A. Novak.', time: 'Yesterday' },
  { id: 'n5', urgency: 'low', icon: 'check', title: 'Weekly DIM digest ready', body: 'Your scheduled Monday summary has been generated.', time: 'Mon' },
];

export const NOTIF_RULES = [
  { id: 'rule1', title: 'DIM price threshold breach', desc: 'Alert when any material index moves beyond ±10% YoY.', email: true, on: true },
  { id: 'rule2', title: 'Forex daily move', desc: 'Alert when EUR/USD moves more than 1.5% in a day.', email: true, on: true },
  { id: 'rule3', title: 'Tender window reminders', desc: 'Notify 3 days before any tender commitment window closes.', email: false, on: true },
  { id: 'rule4', title: 'Weekly DIM digest', desc: 'A scheduled summary every Monday at 08:00.', email: true, on: false },
];
