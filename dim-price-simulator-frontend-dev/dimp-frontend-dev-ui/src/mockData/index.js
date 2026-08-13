// mockData/index.js — barrel re-export for the whole mock dataset.
// In a real deployment these fixtures are replaced by the services/ API layer.
export { USER } from './user.js';
export { NAV, RECENT, ALL_HISTORY } from './navigation.js';
export { SUGGESTIONS } from './suggestions.js';
export {
  ANALYST_TEMPLATES, TRACE_STEPS, TRACE_TOOLS,
  REASONING, REASONING_2, ANSWER_BLOCKS, ANSWER_BLOCKS_2,
  SOURCES, CLARIFY_QUESTIONS, REPORT_BARS,
} from './analyst.js';
export { NOTIFICATIONS, NOTIF_RULES } from './notifications.js';
export { CONSUMPTION } from './consumption.js';
export { DOMAIN_META, PLATFORM_META } from './domains.js';
