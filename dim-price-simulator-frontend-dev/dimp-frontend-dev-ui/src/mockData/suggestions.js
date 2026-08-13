// mockData/suggestions.js — suggestion pills on the empty chat state
export const SUGGESTIONS = [
  {
    id: 'dim', icon: 'trending', label: 'DIM Price',
    prompts: [
      'Run the Fine Paper price model using the latest available volume scenario.',
      'What pricing categories do you support?',
      'Adhesive WB pricing for LA region, December 2025.',
    ],
  },
  {
    id: 'inflation', icon: 'inflation', label: 'Inflation',
    prompts: [
      'Estimate inflation pass-through on packaging suppliers for H2.',
      'How does the latest EUR/USD move change our landed-cost forecast?',
      'Model a 150bps inflation shock across the top supplier tier.',
    ],
  },
  {
    id: 'equipment', icon: 'equipment', label: 'Equipment Price',
    prompts: [
      'What is the price trend for filter-making equipment over 24 months?',
      'Compare maker-line CAPEX quotes across our three primary vendors.',
      'Forecast spare-parts inflation for the converting fleet in 2026.',
    ],
  },
];
