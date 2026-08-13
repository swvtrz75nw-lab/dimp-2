// mockData/analyst.js — analyst templates, reasoning/tool traces, answer bodies,
// sources, clarify questions, and the report chart fixture.

export const ANALYST_TEMPLATES = [
  { id: 'generic', label: 'Generic', icon: 'sheet', desc: 'Structured report with summary, charts and tables.' },
  { id: 'prediction', label: 'Prediction', icon: 'trending', desc: 'Forecast a metric forward with scenario bands.' },
  { id: 'whatif', label: 'What-if', icon: 'wand', desc: 'Model an assumption change and its downstream effect.' },
];

// the staged "thinking" + tool trace for a streamed answer
export const TRACE_STEPS = [
  'Parsing the request and identifying the relevant cost categories.',
  'Pulling the latest DIM price index and spend cube from the data room.',
  'Cross-checking against the budget baseline and last quarter actuals.',
  'Composing the breakdown and flagging the highest-movement materials.',
];

export const TRACE_TOOLS = [
  { name: 'query_spend_cube', input: 'category="DIM", period="2026-Q1..Q3", group_by="material"', output: '5 materials returned · total spend $418.2M · top mover: acetate tow +11.4% YoY' },
  { name: 'fetch_price_index', input: 'index="DIM_COMPOSITE", freq="monthly", lookback=24', output: '24 points · composite +6.8% over window · σ = 2.1%' },
  { name: 'compare_budget', input: 'scope="EU_cluster", metric="DIM_cost", vs="budget_FY26"', output: 'actual $418.2M vs budget $399.0M · variance +4.8% ($19.2M over)' },
  { name: 'list_contracts', input: 'material="acetate_tow", status="active"', output: '3 agreements · 64% volume hedged to Q2 · spot exposure rising' },
];

// the interleaved reasoning flow: each thinking step, with the tool calls it triggered.
export const REASONING = [
  { step: 'Reading the request — you want the top direct input materials ranked by spend, with their year-over-year price movement. Scoping to the EU cluster, FY26 to date.', tools: [] },
  { step: 'Pulling the spend cube and the composite price index together so I can rank materials by spend and confirm the trend is broad, not a one-off month.', tools: [TRACE_TOOLS[0], TRACE_TOOLS[1]] },
  { step: 'Acetate tow is the top line. Checking the actuals against the approved FY26 budget baseline and reviewing the live contracts to see how much is already hedged.', tools: [TRACE_TOOLS[2], TRACE_TOOLS[3]] },
  { step: 'I have everything I need — composing the breakdown and flagging the materials driving the over-budget position.', tools: [] },
];

export const REASONING_2 = [
  { step: 'Following up on acetate tow exposure. I already have the spend and price series loaded, so I will model the sensitivity rather than re-query.', tools: [] },
  { step: 'Running a quick pass-through on the acetate tow line to see how much a further price climb flows into the EU cluster cost.', tools: [{ name: 'model_sensitivity', input: 'material="acetate_tow", shock="+5%..+15%", base_spend=146.3', output: '+10% acetate tow → +$14.6M EU cluster · ~76% of incremental variance' }] },
];

// the streamed answer body (rendered as paragraphs + a small table)
export const ANSWER_BLOCKS = [
  { type: 'p', text: 'Across the first three quarters of FY26, direct input materials accounted for $418.2M of spend in the EU cluster — running 4.8% ($19.2M) above the budgeted baseline. The variance is concentrated in two materials rather than spread evenly.' },
  { type: 'h', text: 'Top 5 materials by spend' },
  { type: 'table', head: ['Material', 'Spend', 'YoY price'], rows: [
    ['Acetate tow', '$146.3M', '+11.4%'],
    ['Tipping paper', '$78.9M', '+5.2%'],
    ['Cigarette paper', '$71.4M', '+3.1%'],
    ['Plug wrap', '$64.0M', '−0.8%'],
    ['Filter glue', '$57.6M', '+2.4%'],
  ]},
  { type: 'p', text: 'Acetate tow is the dominant driver: it is both the largest line and the fastest-rising, contributing roughly 62% of the over-budget variance on its own. Tipping paper is a secondary contributor. I would prioritise a hedge review on acetate tow and re-open the tipping-paper tender before the Q4 commitment window closes.' },
];

// follow-up answer (second seeded turn)
export const ANSWER_BLOCKS_2 = [
  { type: 'p', text: 'Acetate tow is by far the most exposed line. At $146.3M it is already the largest single material, and a further climb flows almost directly into the EU cluster cost with little offset.' },
  { type: 'h', text: 'Sensitivity to a further acetate move' },
  { type: 'table', head: ['Acetate tow move', 'Added EU cost', 'Share of variance'], rows: [
    ['+5%', '$7.3M', '~71%'],
    ['+10%', '$14.6M', '~76%'],
    ['+15%', '$21.9M', '~80%'],
  ]},
  { type: 'p', text: 'A 10% rise alone adds about $14.6M — roughly three-quarters of the incremental over-budget position. That is the line to hedge first; the other four materials together move the number far less.' },
];

export const SOURCES = [
  { id: 's1', name: 'DIM_Spend_Cube_FY26.xlsx', meta: 'Sheet: EU_cluster · 12,480 rows', kind: 'xlsx' },
  { id: 's2', name: 'DIM_Price_Index_Monthly.xlsx', meta: 'Composite + by-material, 24 mo', kind: 'xlsx' },
  { id: 's3', name: 'Budget_Baseline_FY26.xlsx', meta: 'Approved v3 · locked', kind: 'xlsx' },
  { id: 's4', name: 'Acetate_Tow_Contracts.pdf', meta: '3 active agreements', kind: 'pdf' },
];

export const CLARIFY_QUESTIONS = [
  { q: 'Which scope should I analyse?', options: ['EU cluster only', 'Global, all clusters', 'Top 10 markets'] },
  { q: 'What time window?', options: ['Last 4 quarters', 'FY26 to date', 'Trailing 24 months'] },
  { q: 'How should I treat forex?', options: ['Constant currency', 'As reported', 'Both, side by side'] },
];

// bar chart fixture for the analyst report ("Spend by material")
export const REPORT_BARS = [
  { x: 'Acetate', v: 1.0, alt: true }, { x: 'Tipping', v: 0.54 }, { x: 'Cig. paper', v: 0.49 },
  { x: 'Plug wrap', v: 0.44 }, { x: 'Glue', v: 0.39 },
];
