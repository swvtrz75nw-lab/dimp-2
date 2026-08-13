// mockData/consumption.js — token / cost usage for the Consumption tab
export const CONSUMPTION = {
  used: 1_840_000, limit: 2_500_000, cost: 92.4, budget: 125,
  byTool: [
    { name: 'Chat', tokens: 1_120_000, color: 'var(--pmi-blue)' },
    { name: 'Analyst', tokens: 720_000, color: 'var(--pmi-magenta)' },
  ],
  months: [
    { m: 'Jan', v: 0.42 }, { m: 'Feb', v: 0.55 }, { m: 'Mar', v: 0.61 },
    { m: 'Apr', v: 0.7 }, { m: 'May', v: 0.66 }, { m: 'Jun', v: 0.74 },
  ],
};
