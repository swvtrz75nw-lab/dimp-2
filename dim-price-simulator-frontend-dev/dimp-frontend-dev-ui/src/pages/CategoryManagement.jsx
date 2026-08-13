// categoryData.jsx — seeded model cards, extraction fixtures, onboarding content
import React from 'react';
import { Icon } from '../components/Icon.jsx';
import { DynamicIsland } from '../components/Island.jsx';
import { UserMessage, ThinkingBlock, AnswerBody, ReasonItem } from '../components/Messages.jsx';
import { USER } from '../mockData/user.js';
import {
  createCategory,
  uploadFile,
  saveTestCases,
  saveCalculations,
  runSwarm,
  pollJobUntilDone,
  checkInterviewReady,
  getInterviewConfig,
} from '../services/onboardingApi.js';
import './CategoryManagement.css';

const INTERVIEW_AGENT_BASE = import.meta.env.VITE_INTERVIEW_AGENT_URL || 'https://dimp-dev.dimp-dev.aws.private-pmideep.biz';

const CAT_STAGES = [
  {
    n: 1, label: 'Category Definition', mins: '~10 min',
    detail: 'Name the category, upload the workbook or contract you already price from, write a few test cases, and describe the calculation in your own words.'
  },
  {
    n: 2, label: 'Confirm Details', mins: '~12 min',
    detail: 'I show you what I understood — table schemas, formula lineage, the business rules — and ask about the handful of things your file leaves ambiguous.'
  },
  {
    n: 3, label: 'Run Validation Tests', mins: '~5 min',
    detail: 'I replay your historical spend through the model and show you where it agrees with actuals, before anyone relies on it.'
  },
  {
    n: 4, label: 'Review & Approve', mins: '~3 min',
    detail: 'Final model card, audit trail, and the sign-off that publishes the category to the live pricing engine.'
  },
];

const WELCOME_LEAD = [
  { type: 'p', text: 'Welcome. What we are about to do is train me to predict the price effect on your category.' },
  { type: 'p', text: 'That means collecting what you know — how this category is priced, what moves it, the judgement you apply that never made it into a spreadsheet. I do the reading and the maths; you supply the knowledge.' },
];

const WELCOME_OUTPUTS = [
  {
    icon: 'cube', tag: 'The "how"', t: 'Model Card',
    b: 'Everything needed to compute the price effect on your category, written down from what you tell me: the drivers, the formulas, the rules and exceptions. It is the method — the how.'
  },
  {
    icon: 'database', tag: 'The "what"', t: 'Data Semantic',
    b: 'My understanding of the data you upload — which tables mean what, how the columns are typed, how they connect. This is the data the model runs on, and you refresh it whenever the numbers move. It is the what.'
  },
];

const WELCOME_RULES = [
  { icon: 'chat', t: 'Ask me anything, at any point', b: 'If a question does not make sense, say so. I would rather explain than have you guess.' },
  { icon: 'pencil', t: 'Tell me to change what you see', b: 'Anything on any page — the data semantic, the model card, a rule I got wrong. Say it and I apply it.' },
  { icon: 'tool', t: 'The workbench is always on the right', b: 'It holds the tasks for whichever stage you are on. If you are unsure what to do next, it is in there.' },
  { icon: 'brain', t: 'This transfers what is in your head', b: 'That takes explaining. The more you say out loud, the better the model that comes out the other side.' },
];

const CAT_CARDS = [
  {
    name: 'Adhesives', owner: 'Sarah Jenkins', role: 'Lead Chemical Category Manager',
    updated: '2026-07-18', version: 'v2', tags: ['Resin Index', 'Additives', 'Volume Rebates'], tables: 3, access: true,
    logic: 'Adhesives spend engine converting Resin market index + Additives cost basis + supplier commercial discount terms into price_effect_per_commercial across Supplier A / Supplier B contracts. Volume rebate brackets apply above 10,000 lbs.',
  },
  {
    name: 'Shipping', owner: 'Marcus Vance', role: 'Global Shipping & Logistics Director',
    updated: '2026-07-21', version: 'v1', tags: ['Ocean Freight Index', 'Container Rates', 'Fuel Surcharge'], tables: 3, access: true,
    logic: 'Ocean and inland shipping spend engine applying container base rates, carrier bulk-volume discounts, and a monthly bunker fuel surcharge index to compute net_shipping_cost per lane and container type.',
  },
  {
    name: 'Fine Paper Global Pulp', owner: 'David Chen', role: 'Global Pulp Category Director',
    updated: '2026-06-30', version: 'v1', tags: ['RISI Index', 'FX Conversion', 'Multi-Scenario'], tables: 6, access: true,
    logic: 'Pulp procurement spend engine converting RISI benchmark indices (NBSK Europe, NBSK USA, BHKP, EUCA) + ECB FX rates (EUR/USD, CAD/EUR) + supplier grade compositions into supplier pulp spend across 4 scenarios.',
  },
  {
    name: 'AT Budget', owner: 'Priya Nair', role: 'Above-The-Line Trade & Marketing Budget Manager',
    updated: '2026-07-10', version: 'v1', tags: ['Campaign Spend', 'Trade Promotions', 'Media Mix'], tables: 3, access: false,
    logic: 'Above-the-line trade and marketing budget engine allocating approved annual spend across campaign types by region and brand, tracking committed vs. actual spend and flagging overrun risk.',
  },
  {
    name: 'Susceptor', owner: 'Marco Bellini', role: 'RRP Components Category Manager',
    updated: '2026-07-05', version: 'v1', tags: ['Stainless Steel Index', 'Induction Blade', 'Supplier Yield'], tables: 3, access: false,
    logic: 'Heated tobacco susceptor component spend engine converting stainless-steel/nickel-alloy market index + supplier manufacturing yield rates + tooling amortization into a net landed cost per induction-heating blade unit.',
  },
];

const CONFIRM_QUESTIONS = [
  {
    id: 'q1', type: 'mc', question: 'What does "FY 26 QSM" represent in the TU - Code (Tipping Paper) sheet?',
    recommend: 'A cost value — Quarterly Standard Material cost, in EUR per unit (transfer-pricing basis)',
    why: 'The column sits beside vendor and material codes, carries two decimals in EUR, and never appears alongside a unit-of-measure column — that pattern reads as a cost basis rather than a volume.',
    options: [
      'A cost value — Quarterly Standard Material cost, in EUR per unit (transfer-pricing basis)',
      'A volume — quarterly material volume forecast, in units',
      'A price per unit — standard unit price, not a cost basis']
  },
  {
    id: 'q2', type: 'mc', question: 'The workbook models four scenarios — 2024 Base, 2025 OPP, Q2 Actuals + 2026 Forecast, and 2026 Forecast. Which one should be the primary baseline for 2026 supplier spend decisions?',
    recommend: 'Q2 Actuals + 2026 Forecast — blended actuals-to-date plus forward forecast',
    why: 'It is the only test case with committed volumes already booked, so quotes built on it are defensible against both actuals and plan.',
    options: [
      '2026 Forecast — the latest full-year forecast volumes and pricing',
      '2025 OPP — the approved Operating Plan baseline',
      'Q2 Actuals + 2026 Forecast — blended actuals-to-date plus forward forecast']
  },
  {
    id: 'q3', type: 'mc', question: 'Are FX conversions (EUR/USD, CAD/EUR) applied using ECB period averages, or spot rates at the time of each order?',
    recommend: 'ECB period averages (2026 EUR/USD 1.1126, CAD/EUR 0.6421) — applied annually per Sheet 6',
    why: 'Sheet 6 holds a single annual rate per pair and every spend formula points at that one cell — no order-level rate exists in the file.',
    options: [
      'ECB period averages (2026 EUR/USD 1.1126, CAD/EUR 0.6421) — applied annually per Sheet 6',
      'Spot exchange rates captured at each individual contract/order date',
      'A 12-month rolling average FX curve per supplier currency']
  },
  {
    id: 'q4', type: 'open', question: 'How does this category actually get priced in practice — anything the workbook does not capture?',
    hint: 'Negotiation levers, informal rules of thumb, when you override the model, who has to sign off.',
    recommend: 'Quarterly index resets are negotiated with a 30-day lag against RISI, and anything above a 5% swing goes to the category director before it reaches a supplier.',
    why: 'Most categories carry judgement that never lands in a cell — that is exactly the knowledge worth capturing here.',
    dictation: 'We reset against RISI quarterly but with about a thirty day lag, and anything moving more than five percent needs the category director to sign off before it goes to the supplier.'
  },
];

const SCENARIO_COUNT = 3;

const SCENARIO_SAMPLES = [
  {
    q: 'What is the 2026 NBSK Europe benchmark used for Delfort fine paper?', a: '$1,523.75 per MT, per the 2026 RISI block.',
    dq: 'What is the 2026 NBSK Europe benchmark we use for Delfort fine paper?', da: 'One thousand five hundred twenty three dollars seventy five per metric tonne, from the 2026 RISI block.'
  },
  {
    q: 'Which supplier carries the highest 2026 pulp spend?', a: 'Delfort EU, driven by cigarette paper volume.',
    dq: 'Which supplier carries the highest pulp spend in 2026?', da: 'Delfort EU, mostly because of cigarette paper volume.'
  },
  {
    q: 'What happens to spend if EUR/USD moves to 1.20?', a: 'USD-denominated grades fall roughly 7% in EUR terms.',
    dq: 'What happens to our spend if the euro dollar rate moves to one twenty?', da: 'The dollar denominated grades come down about seven percent in euro terms.'
  },
  {
    q: 'What is the shortfall penalty if we buy under 5,000 MT in 2026?', a: '$42.00 per MT on the shortfall volume, 60 days notice.',
    dq: 'What is the penalty if we buy under five thousand tonnes in 2026?', da: 'Forty two dollars per tonne on the shortfall, with sixty days notice.'
  },
  {
    q: 'Which pulp grade improved year on year?', a: 'BHKP Europe, down 12.53% — a cost saving.',
    dq: 'Which pulp grade improved year on year?', da: 'BHKP Europe, it came down twelve and a half percent so it is a saving.'
  },
];

const CALC_PROMPTS = [
  {
    id: 'drivers', label: 'What are the inputs and drivers?', ph: 'e.g. RISI benchmark per grade, ECB FX rates, grade composition ratios, contracted volume…',
    dictation: 'The main drivers are the RISI benchmark per pulp grade, the ECB euro dollar and Canadian dollar rates, the composition ratio for each grade, and the contracted volume per supplier.'
  },
  {
    id: 'output', label: 'Where do I find the output?', ph: 'e.g. All Suppliers sheet, test case 4 spend column…',
    dictation: 'The output is on the All Suppliers sheet, the test case four total spend column at the far right.'
  },
  {
    id: 'formulas', label: 'What are the typical formulas used to compute it?', ph: 'e.g. volume × base price × FX rate, then the freight and rebate adjustments…',
    dictation: 'Broadly it is volume times base price times the FX rate, then we layer the freight surcharge and take off the volume rebate.'
  },
];

const PROCESS_FLAVOURS = [
  'Looking through your files…',
  'Reading the tables one by one…',
  'Working out what each column means…',
  'Following how the numbers connect…',
  'Reading the contract terms…',
  'Making sense of your suppliers and codes…',
  'Checking your test cases against what I found…',
  'Putting the picture together…',
];

const WELCOME_BLOCKS = [
  { type: 'p', text: 'Welcome. We are about to onboard a new pricing category — the thing that lets me quote a number for it and show my work.' },
  { type: 'p', text: 'Set aside about 30 minutes. This is a working session, not a form, and it moves at the speed you can explain your own data.' },
  { type: 'p', text: 'There are four stages and I walk you through every one of them. Along the way you will go through a number of exercises — naming things, uploading what you already use, writing test cases, describing the calculation in your own words.' },
  { type: 'p', text: 'Ask me clarifying questions at any point. And if you do not like something you see on any page, tell me and I will change it — that applies to the data semantic and the model card as much as anything else.' },
  { type: 'p', text: 'A workbench is always open on the right with the tasks for the stage you are on. If you are ever unsure what to do next, it is in there.' },
  { type: 'p', text: 'One last thing, and it is the part that matters most: this process is about taking the knowledge that lives in your head and transferring it to me. That takes time and it takes explaining. The more you say out loud, the better the model that comes out the other side.' },
];

const STAGE1_BLOCKS = [
  { type: 'p', text: 'Stage one — category definition. Put everything you use to price this category into the card on the right: Excel workbooks, signed contract PDFs, whatever you actually open when someone asks you for a number.' },
  { type: 'p', text: 'Beyond the files, I will ask you for a few more things in the workbench.' },
  { type: 'h', text: 'Test Cases' },
  { type: 'p', text: 'A test case is a question plus the correct answer for it, based on the data you have given me. Once I have read your files I get tested against them — if I can answer them correctly, the model is doing its job.' },
  { type: 'h', text: 'Drivers and output' },
  { type: 'p', text: 'What feeds the calculation, and what the calculation produces, so I can compute the price effect on your category. Say it in your own words — dictate it if typing is a chore.' },
];

const STAGE2_BLOCKS = [
  { type: 'p', text: 'Stage two. The data is loaded and I have a first reading of it. You have a few things to do.' },
  { type: 'p', text: '1. Answer my questions — they are in the workbench. A few constructs in your files are genuinely ambiguous and your answer decides how the engine reads them.' },
  { type: 'p', text: '2. Review the Data Semantic tab and check I have understood your data and what it means. This one matters a lot — everything downstream is built on it.' },
  { type: 'p', text: '3. Review the Model Card Preview — this is what I understood and what I will be able to work out from it.' },
  { type: 'p', text: 'And the standing offer: at any point, if something in the Data Semantic or the Model Card is wrong, tell me and I will change it directly.' },
];

const EXCEL_WORKSHEETS = {
  RISI_Index: {
    description: 'Monthly RISI pulp price index benchmarks (NBSK EU, NBSK USA, BHKP EU, EUCA) with YoY variance and portfolio weightings.',
    rowCount: 80,
    columns: [
      { name: 'period', type: 'string', desc: 'Contract period block', sample: '2026 Block / Month 1' },
      { name: 'grade', type: 'string', desc: 'Pulp grade benchmark', sample: 'Bl. Softwood Kraft NBSK Europe' },
      { name: 'base_current', type: 'float', desc: 'Current benchmark price ($/MT)', sample: '$1,523.75' },
      { name: 'base_prior', type: 'float', desc: 'Prior period benchmark ($/MT)', sample: '$1,481.25' },
      { name: 'variance', type: 'float', desc: 'YoY price delta ($/MT)', sample: '+$42.50' },
      { name: 'pct_change', type: 'string', desc: 'Percentage price variance', sample: '+2.87%' },
      { name: 'portfolio_weight', type: 'float', desc: 'Category portfolio weight', sample: '0.36' },
      { name: 'portfolio_contribution', type: 'float', desc: 'Weighted YoY contribution', sample: '+0.0103' },
    ],
    rows: [
      ['2026 Block', 'Bl. Softwood Kraft NBSK Europe', '$1,523.75', '$1,481.25', '+$42.50', '+2.87%', '0.36'],
      ['2026 Block', 'Bl. Softwood Kraft NBSK USA', '$1,733.33', '$1,588.33', '+$145.00', '+9.13%', '0.15'],
      ['2026 Block', 'Bl. Hardwood Kraft BHKP Europe', '$1,079.58', '$1,234.17', '−$154.58', '−12.53%', '0.25'],
      ['2026 Block', 'Eucalyptus Pulp EUCA Europe', '$1,271.67', '$1,359.58', '−$87.92', '−6.47%', '0.24'],
    ],
    rowHead: ['period', 'grade', 'base_current', 'base_prior', 'variance', 'pct_change', 'weight'],
  },
  All_Suppliers: {
    description: 'Main spend model applying volume × price under 4 scenarios across 169 supplier grade lines and 46 data columns.',
    rowCount: 169,
    columns: [
      { name: 'supplier', type: 'string', desc: 'Global supplier name', sample: 'Delfort EU' },
      { name: 'category', type: 'string', desc: 'Product category family', sample: 'Cigarette Paper' },
      { name: 'code', type: 'string', desc: 'Supplier internal code', sample: 'CP.A930' },
      { name: 'grade', type: 'string', desc: 'Paper specification & GSM', sample: 'Std Wood High Opacity [28gsm]' },
      { name: 'nbsk_comp', type: 'float', desc: 'NBSK softwood share (kg/kg)', sample: '0.868' },
      { name: 'currency', type: 'string', desc: 'Contract currency', sample: 'EUR' },
      { name: 'price_2026', type: 'float', desc: 'Base 2026 price per unit', sample: '€6.620' },
      { name: 'vol_2026_opp', type: 'float', desc: '2026 OPP volume forecast (000 SQM)', sample: '21,975' },
      { name: 'spend_scenario_4', type: 'float', desc: 'Scenario 4 total spend ($)', sample: '$496,570.00' },
    ],
    rows: [
      ['Delfort EU', 'Cigarette Paper', 'CP.0707', 'Std Wood <80 CU [28gsm]', '0.906', 'EUR', '€5.601'],
      ['Delfort EU', 'Cigarette Paper', 'CP.A930', 'Std Wood High Opacity [28gsm]', '0.868', 'EUR', '€6.620'],
      ['Tann EU', 'Tipping Paper', 'TP.A813', 'Standard Tipping [32gsm]', '0.750', 'EUR', '€4.850'],
    ],
    rowHead: ['supplier', 'category', 'code', 'grade', 'nbsk_comp', 'currency', 'price_2026'],
  },
  TU_Code_Tipping: {
    description: 'Granular tipping paper transfer pricing dataset across EU, AP, EEMEA, and LA regions.',
    rowCount: 3132,
    columns: [
      { name: 'region', type: 'string', desc: 'Operating region', sample: 'EU' },
      { name: 'material_code', type: 'string', desc: 'SAP material ID', sample: '32.FJFS' },
      { name: 'vendor_name', type: 'string', desc: 'Manufacturing vendor', sample: 'TANNPAPIER GMBH' },
      { name: 'vendor_group', type: 'string', desc: 'Global vendor group', sample: 'Tann' },
      { name: 'tp_code', type: 'string', desc: 'Tipping product code', sample: 'TP.A813' },
      { name: 'fy26_qsm', type: 'float', desc: 'Quarterly standard material cost', sample: '231.57' },
    ],
    rows: [
      ['EU', '32.FJFS', 'TANNPAPIER GMBH', 'Tann', 'TP.A813', '231.57'],
      ['AP', '32.FGQ1', 'ZHEJIANG BENKERT TIPPING PAPER', 'Delfort', 'TP.A687', '1,062.04'],
      ['EEMEA', '32.FGB8', 'TANN IZMIR KAGIT SANAYI', 'Tann', 'TP.A673', '17,303.62'],
    ],
    rowHead: ['region', 'material_code', 'vendor_name', 'vendor_group', 'tp_code', 'fy26_qsm'],
  },
  CP_Code_Cigarette: {
    description: 'Cigarette paper material-vendor mapping with FY2026 volume forecast (1.13M SQM total).',
    rowCount: 351,
    columns: [
      { name: 'region', type: 'string', desc: 'Operating region', sample: 'EU' },
      { name: 'material_code', type: 'string', desc: 'SAP material ID', sample: '30.A9L8' },
      { name: 'vendor_name', type: 'string', desc: 'Manufacturing vendor', sample: 'PAPIERFABRIK WATTENS GMBH' },
      { name: 'vendor_group', type: 'string', desc: 'Global vendor group', sample: 'Delfort' },
      { name: 'ts_code', type: 'string', desc: 'Cigarette paper code', sample: 'CP.A018' },
      { name: 'fy2026_sqm', type: 'float', desc: '2026 SQM volume forecast', sample: '39,987.68' },
    ],
    rows: [
      ['EU', '30.A9L8', 'PAPIERFABRIK WATTENS GMBH', 'Delfort', 'CP.A018', '39,987.68'],
      ['LA', '30.A084', 'MUDANJIANG HENGFENG PAPER', 'HENFENGF', 'CP.A034', '20,065.50'],
    ],
    rowHead: ['region', 'material_code', 'vendor_name', 'vendor_group', 'ts_code', 'fy2026_sqm'],
  },
  PW_Code_FinePaper: {
    description: 'Fine paper plug wrap material-vendor mapping across product codes (PW.A445, PW.0402, PW.A044).',
    rowCount: 309,
    columns: [
      { name: 'region', type: 'string', desc: 'Operating region', sample: 'EU' },
      { name: 'material_code', type: 'string', desc: 'SAP material ID', sample: '23.A665' },
      { name: 'vendor_name', type: 'string', desc: 'Manufacturing vendor', sample: 'OP PAPIRNA SRO' },
      { name: 'vendor_group', type: 'string', desc: 'Global vendor group', sample: 'Delfort' },
      { name: 'ts_code', type: 'string', desc: 'Plug wrap code', sample: 'PW.A101' },
      { name: 'fy2026_sqm', type: 'float', desc: '2026 SQM volume forecast', sample: '21,012.66' },
    ],
    rows: [['EU', '23.A665', 'OP PAPIRNA SRO', 'Delfort', 'PW.A101', '21,012.66']],
    rowHead: ['region', 'material_code', 'vendor_name', 'vendor_group', 'ts_code', 'fy2026_sqm'],
  },
  ECB_FX: {
    description: 'ECB exchange rate reference (EUR/USD and CAD/EUR) across 2023–2026.',
    rowCount: 24,
    columns: [
      { name: 'period', type: 'string', desc: 'Reporting period', sample: '2026' },
      { name: 'currency_pair', type: 'string', desc: 'FX currency pair', sample: 'EUR/USD' },
      { name: 'period_average', type: 'float', desc: 'Period average rate', sample: '1.1126' },
      { name: 'low', type: 'float', desc: 'Period low', sample: '1.0890' },
      { name: 'high', type: 'float', desc: 'Period high', sample: '1.1345' },
    ],
    rows: [['2026', 'EUR/USD', '1.1126', '1.0890', '1.1345'], ['2026', 'CAD/EUR', '0.6421', '0.6190', '0.6580']],
    rowHead: ['period', 'currency_pair', 'period_average', 'low', 'high'],
  },
};

const RELATIONSHIPS = [
  { a: 'ECB Indices (EUR/USD averages)', b: 'All Suppliers · FX Rates', d: 'ECB period averages become the annual EUR/USD rates used to convert supplier prices to a common currency.' },
  { a: 'ECB Indices (CAD/EUR averages)', b: 'All Suppliers · FX Rates', d: 'ECB period averages become the annual CAD/EUR rates used to convert supplier prices to a common currency.' },
  { a: 'RISI Index (monthly prices)', b: 'All Suppliers · Global Pulp Prices', d: 'Monthly indices are averaged to derive the annual benchmark price per pulp grade.' },
  { a: 'RISI Index (portfolio contribution)', b: 'All Suppliers · Supplier Spend Model', d: 'Year-over-year portfolio-weighted % changes inform price assumptions in the spend model.' },
  { a: 'TU - Code (material/vendor records)', b: 'All Suppliers · Supplier Spend Model', d: 'Material-vendor pricing and volumes feed the spend model for tipping paper.' },
  { a: 'CP - Code (material/vendor volumes)', b: 'All Suppliers · Supplier Spend Model', d: 'FY2026 volume forecasts feed the spend model for cigarette paper by vendor.' },
  { a: 'PW - Code (material/vendor volumes)', b: 'All Suppliers · Supplier Spend Model', d: 'FY2026 volume forecasts feed the spend model for fine paper by vendor.' },
];

const INTRA_RELATIONSHIPS = [
  { a: 'RISI_Index · Table 1A (Monthly Prices)', b: 'Table 1B (Base Comparison)', d: 'The Base 2024 average from Table 1A becomes the "Base (prior)" for the 2025 comparison block.' },
  { a: 'All_Suppliers · Table 2A (FX Rates)', b: 'Table 2C (Supplier Spend Model)', d: 'FX rates convert supplier prices to a common currency before spend is calculated.' },
  { a: 'All_Suppliers · Table 2B (Global Prices)', b: 'Table 2C (Supplier Spend Model)', d: 'Benchmark pulp prices × composition ratios = base cost per supplier-grade.' },
  { a: 'CP_Code_Cigarette · Table 4B (Code Reference)', b: 'Table 4A (Material-Vendor Mapping)', d: 'Lookup: translates Delfort codes into standardized grade names.' },
  { a: 'PW_Code_FinePaper · Table 5A (Code Reference)', b: 'Table 5B (Material-Vendor Mapping)', d: 'Lookup: translates vendor codes into standardized product names.' },
];

const EXCEL_FORMULAS = [
  { name: 'pulp_spend_scenario', expr: 'Volume × Base_Price × FX_Rate', desc: 'Computes total pulp spend per supplier across 4 scenario models.' },
  { name: 'price_variance_yoy', expr: 'Base_2026 − Base_2025', desc: 'Year-over-year benchmark price variance per pulp grade.' },
  { name: 'portfolio_contribution', expr: '%_Change × Portfolio_Share', desc: 'Portfolio-weighted YoY cost impact per pulp grade.' },
];

const PDF_TABLES = [
  {
    title: 'Minimum purchase volume commitments & penalties', src: 'Page 4, paragraph 2',
    head: ['Contract year', 'Min annual MT', 'Shortfall penalty', 'Notice days'],
    rows: [['2026', '5,000 MT', '$42.00 / MT', '60 days'], ['2027', '5,500 MT', '$45.00 / MT', '60 days']]
  },
  {
    title: 'Emergency freight rail surcharge schedule', src: 'Page 9, section B',
    head: ['Order lead time', 'Surcharge %', 'Carrier mode'],
    rows: [['< 3 business days', '+15.0%', 'Expedited freight rail'], ['3–7 business days', '+8.5%', 'Standard rail transport']]
  },
];

const PDF_CLAUSES = [
  { n: 'Clause 4.2 — Minimum purchase commitment', t: 'Buyer commits to a minimum annual purchase volume as defined in Schedule A. Any shortfall below the committed volume is subject to a per-MT penalty as outlined in Table 1.' },
  { n: 'Clause 8.1 — Grade specification moisture credit', t: 'Moisture content exceeding 10.0% grants buyer a $5.00 CAD per metric tonne credit applied directly on invoice settlement.' },
];

const PDF_FIGURES = [
  { t: 'Figure 1 — Softwood pulp historical price index', m: '99.4% match', s: 'Extracted series: NBSK peak €860/MT, baseline €810/MT', bars: [50, 74, 100, 80, 90], c: 'var(--pmi-cyan)' },
  { t: 'Figure 2 — Rail distance vs surcharge curve', m: '98.9% match', s: 'Surcharge rises with distance across 5 rail zones', bars: [33, 50, 66, 80, 100], c: 'var(--c-orange)' },
];

const REASONING_STEPS = [
  { t: 'Parsed the workbook structure', b: 'Read 6 worksheets and isolated 19 discrete tables by scanning for header rows, merged-cell banners, and blank-row separators.' },
  { t: 'Typed every column', b: 'Inferred data types and units from cell formats and value distributions — currency symbols on price columns, thousands-separated floats on SQM volumes, ISO period strings on FX rows.' },
  { t: 'Traced formula lineage', b: 'Followed 28 cell references across sheets to reconstruct which tables feed which. FX rates in All_Suppliers resolve back to ECB period averages; benchmark prices resolve back to RISI monthly blocks.' },
  { t: 'Reconciled vendor codes', b: 'Matched TU / CP / PW material codes to vendor groups using the in-sheet lookup tables, then rolled 3,792 material rows up to 169 supplier-grade lines.' },
  { t: 'Flagged 3 ambiguities', b: 'Three constructs could not be resolved from the file alone — the meaning of FY 26 QSM, the primary test case baseline, and the FX convention. These are the questions in the workbench.' },
];

const SEED_TABLES = [
  { name: 'RISI_Index', desc: 'RISI benchmark pulp price indices & portfolio-weighted YoY variance.', rows: 80 },
  { name: 'All_Suppliers_Spend_Model', desc: 'Main calculation engine applying volume × price under 4 scenarios across 46 columns.', rows: 169 },
  { name: 'TU_Code_Tipping_Paper', desc: 'Tipping paper material-vendor transfer pricing dataset.', rows: 3132 },
  { name: 'CP_Code_Cigarette_Paper', desc: 'Cigarette paper material-vendor mapping and 1.13M SQM volume forecast.', rows: 351 },
  { name: 'PW_Code_Fine_Paper', desc: 'Fine paper plug wrap material mapping across suppliers.', rows: 309 },
  { name: 'ECB_Indices_FX', desc: 'ECB exchange rate reference (EUR/USD and CAD/EUR) across 2023–2026.', rows: 24 },
];

const DEMO_FILE = { name: 'Fine Paper Global Pulp Update 2026 with TANN CAD.xlsx', size: 2.8, kind: 'excel' };
const DEMO_PDF = { name: 'Pulp_Supply_Agreement_2026.pdf', size: 1.45, kind: 'pdf' };

const STAGE3_BLOCKS = [
  { type: 'p', text: 'Stage three. I ran the test cases you wrote against the model I built from your data, and I am showing you every one — what I answered, what you expected, and the trace of how I got there.' },
  { type: 'p', text: 'For the ones I got wrong: read the trace, work out where my understanding went off, and tell me the correct reasoning. Then re-run the test — a test case only clears once it passes.' },
  { type: 'p', text: 'If it is easier to talk it through, take the test case up with me here and we will work it out together.' },
];

const VAL_TRACE_PASS = [
  { step: 'Read the question and worked out what it is asking for' },
  {
    step: 'Looked up the values it depends on', tools: [
      { name: 'semantic.lookup', input: 'entities from question\nscope: category model', output: 'resolved 3 of 3 entities\nsource tables identified' }]
  },
  {
    step: 'Applied the business rules from the model card', tools: [
      { name: 'model_card.apply', input: 'rules: pricing, fx, adjustments', output: 'computed result\nunits consistent with the source' }]
  },
  { step: 'Compared my answer with the one you expected — they agree' },
];

const VAL_TRACE_FAIL = [
  { step: 'Read the question and worked out what it is asking for' },
  {
    step: 'Looked up the values it depends on', tools: [
      { name: 'semantic.lookup', input: 'entities from question\nscope: category model', output: 'resolved 2 of 3 entities\n1 entity ambiguous — two candidate tables' }]
  },
  {
    step: 'Picked the candidate I judged most likely', tools: [
      { name: 'semantic.disambiguate', input: 'candidates: 2\ntie-break: most recent period', output: 'chose the later period\nconfidence 0.58 — low' }]
  },
  {
    step: 'Applied the business rules from the model card', tools: [
      { name: 'model_card.apply', input: 'rules: pricing, fx, adjustments', output: 'computed result on the chosen basis' }]
  },
  { step: 'Compared my answer with the one you expected — they do not agree' },
];

const VAL_TRACE_FIXED = [
  { step: 'Re-read your correction and what it changes' },
  {
    step: 'Rewrote the rule it affects in the model card', tools: [
      { name: 'model_card.update', input: 'correction from the category owner', output: 'rule rewritten\nchange logged' }]
  },
  {
    step: 'Re-resolved the ambiguous entity on the new basis', tools: [
      { name: 'semantic.lookup', input: 'entities from question\nbasis: as corrected', output: 'resolved 3 of 3 entities\nconfidence 0.94' }]
  },
  { step: 'Recomputed and compared with the one you expected — they agree' },
];

const VAL_MISSES = [
  {
    answer: 'I resolved this on the later period rather than the one you meant, so my number comes out on a different basis to yours.',
    steps: [
      'Read the question and identified the benchmark it asks about',
      'Found two candidate tables holding that benchmark, one per contract period',
      'Chose the later period as the basis, since nothing said which takes precedence',
      'Applied the pricing rule from the model card on that basis',
      'Returned the figure computed from the later period',
    ]
  },
  {
    answer: 'I answered with the unadjusted figure — I did not apply the adjustment you expect here.',
    steps: [
      'Read the question and identified the cost line it asks about',
      'Pulled the base figure from the supplier spend model',
      'Found an adjustment in the contract but no rule saying when it applies',
      'Left the adjustment out rather than guess at its trigger',
      'Returned the unadjusted figure',
    ]
  },
  {
    answer: 'I could not resolve one of the terms in your question, so I answered on a partial basis.',
    steps: [
      'Read the question and split it into the terms it depends on',
      'Resolved every term but one against the data semantic',
      'Searched the tables and contract clauses for the remaining term — no match',
      'Computed the part I could resolve and flagged the rest as unknown',
      'Returned a partial answer',
    ]
  },
];

const VAL_PASS_STEPS = [
  'Read the question and identified what it asks for',
  'Resolved every term against the data semantic',
  'Pulled the source values from the mapped tables',
  'Applied the pricing rules from the model card',
  'Compared the result with the answer you expected — they agree',
];

const VAL_FIX_PROMPTS = [
  'The 2026 block is always the basis — never the later period.',
  'Apply the moisture credit whenever content is above 10%.',
  'QSM is a cost basis, not a volume, so use it as a cost input.',
];

const AGENT_REASON = {
  change: [
    { step: 'Parsing the requested change and the value it carries' },
    {
      step: 'Locating the affected rule in the model card', tools: [
        { name: 'model_card.find_rule', input: 'category: fine_paper_global_pulp\nsection: business_rules', output: '2 matching rules\n· freight_surcharge_base\n· rail_zone_multiplier' }]
    },
    {
      step: 'Checking the change against the extracted data semantic', tools: [
        { name: 'semantic.validate', input: 'rule: freight_surcharge_base\nnew_value: from user', output: 'consistent — unit matches $/MT in Table 2C\nno downstream conflicts' }]
    },
    { step: 'Applying it and writing an entry to the change log' },
  ],
  escalate: [
    { step: 'Re-reading the question and what the file says about it' },
    {
      step: 'Pulling the columns and formulas that touch it', tools: [
        { name: 'workbook.trace_column', input: 'sheet: TU - Code (Tipping Paper)\ncolumn: FY 26 QSM', output: 'referenced by 3 formulas in All_Suppliers\nno unit-of-measure column adjacent' }]
    },
    { step: 'Framing the question in plainer terms' },
  ],
  general: [
    { step: 'Checking the question against the current model card' },
    {
      step: 'Looking up the relevant tables and clauses', tools: [
        { name: 'semantic.search', input: 'query: from user message', output: '4 matching tables, 2 contract clauses' }]
    },
  ],
  file: [
    {
      step: 'Reading the file headers and sheet structure', tools: [
        { name: 'workbook.open', input: 'Fine Paper Global Pulp Update 2026 with TANN CAD.xlsx', output: '6 worksheets\n19 header blocks detected' }]
    },
    {
      step: 'Counting tables and sampling rows for typing', tools: [
        { name: 'workbook.sample', input: 'rows_per_table: 40', output: '3,792 material rows\n46 columns typed' }]
    },
  ],
  answer: [
    { step: 'Recording the answer against the question' },
    {
      step: 'Re-checking the model card sections it touches', tools: [
        { name: 'model_card.rebuild', input: 'sections: data_semantic, business_rules', output: 'both sections rewritten' }]
    },
  ],
};

const MC_FULL = false; // mapped tables / formulas / reasoning / change log return in a later pass

Object.assign(window, {
  CAT_STAGES, CAT_CARDS, CONFIRM_QUESTIONS, EXCEL_WORKSHEETS, RELATIONSHIPS, INTRA_RELATIONSHIPS,
  EXCEL_FORMULAS, PDF_TABLES, PDF_CLAUSES, PDF_FIGURES, REASONING_STEPS, SEED_TABLES, DEMO_FILE, DEMO_PDF,
  SCENARIO_COUNT, SCENARIO_SAMPLES, CALC_PROMPTS, PROCESS_FLAVOURS, WELCOME_BLOCKS, STAGE1_BLOCKS, STAGE2_BLOCKS,
  AGENT_REASON, MC_FULL, WELCOME_LEAD, WELCOME_RULES, WELCOME_OUTPUTS,
  STAGE3_BLOCKS, VAL_TRACE_PASS, VAL_TRACE_FAIL, VAL_TRACE_FIXED, VAL_MISSES, VAL_FIX_PROMPTS, VAL_PASS_STEPS,
});
// categoryPanes.jsx — right-pane surfaces: Data Semantic, Model Card Preview, stage placeholders
const { useState: useCPS } = React;

function PaneEmpty({ icon, title, body, pre }) {
  return (
    <div className="pane-empty">
      <div className="pe-ic"><Icon name={icon} size={26} /></div>
      <h4>{title}</h4>
      <p>{body}</p>
      {pre && <div className="pe-pre"><Icon name="clock" size={13} /> {pre}</div>}
    </div>
  );
}

function DataSemanticPane({ files, liveExtraction, liveEnrichment }) {
  const list = files.length ? files : [];

  // Build dynamic worksheets from live extraction data
  const hasLiveData = liveExtraction && liveExtraction.length > 0;
  const liveSheets = {};
  // Build a map from table_id → enrichment entity/summary for display names
  const enrichmentTableMap = {};
  if (liveEnrichment && liveEnrichment.sheets) {
    liveEnrichment.sheets.forEach((s) => {
      (s.tables || []).forEach((t) => {
        if (t.table_id) enrichmentTableMap[t.table_id] = { sheet: s.sheet_name, entity: t.entity || '', summary: t.summary || '', business_purpose: t.business_purpose || '' };
      });
    });
  }

  // Helper: resolve a table_id to "SheetName · EntityName" using enrichmentTableMap
  const resolveTableName = (tableId) => {
    if (!tableId) return '?';
    const info = enrichmentTableMap[tableId];
    if (!info) return tableId;
    return `${info.sheet || '?'} · ${info.entity || tableId}`;
  };

  if (hasLiveData) {
    liveExtraction.forEach((table) => {
      const sheetName = table.sheet || 'Unknown';
      if (!liveSheets[sheetName]) liveSheets[sheetName] = { tables: [], description: '', rowCount: 0 };
      liveSheets[sheetName].tables.push(table);
      liveSheets[sheetName].rowCount += table.n_rows || 0;
    });
    if (liveEnrichment && liveEnrichment.sheets) {
      liveEnrichment.sheets.forEach((s) => {
        if (liveSheets[s.sheet_name]) {
          liveSheets[s.sheet_name].description = s.sheet_summary || s.sheet_role || '';
          liveSheets[s.sheet_name].role = s.sheet_role || '';
        }
      });
    }
  }

  const liveRels = [];
  const liveIntraRels = [];
  if (liveEnrichment) {
    (liveEnrichment.cross_sheet_relationships || []).forEach((r) => {
      liveRels.push({ a: r.source_sheet || r.source || resolveTableName(r.from_table_id), b: r.target_sheet || r.target || resolveTableName(r.to_table_id), d: r.description || r.relationship || '' });
    });
    (liveEnrichment.sheets || []).forEach((s) => {
      (s.relationships || []).forEach((r) => {
        liveIntraRels.push({ a: `${s.sheet_name} · ${r.source_table || r.from || ''}`, b: `${s.sheet_name} · ${r.target_table || r.to || ''}`, d: r.description || r.relationship || '' });
      });
    });
  }

  const sheetKeys = hasLiveData ? Object.keys(liveSheets) : [];
  const displayRels = liveRels;
  const displayIntraRels = liveIntraRels;

  // Accordion state: track which sheets and tables are expanded
  const [expandedSheets, setExpandedSheets] = useCPS(() => {
    const init = {};
    sheetKeys.forEach((k) => { init[k] = false; }); // all closed by default
    return init;
  });
  const [expandedTables, setExpandedTables] = useCPS({});
  const [sec, setSec] = useCPS('schema');

  const toggleSheet = (k) => setExpandedSheets((s) => ({ ...s, [k]: !s[k] }));
  const toggleTable = (id) => setExpandedTables((s) => ({ ...s, [id]: !s[id] }));

  const totalTables = hasLiveData ? liveExtraction.length : 0;
  const totalRows = hasLiveData ? liveExtraction.reduce((n, t) => n + (t.n_rows || 0), 0) : 0;

  return (
    <div>
      <div className="wb-head">
        <h3>Data semantic</h3>
        <p>{hasLiveData
          ? `Extracted from your uploaded workbook — ${totalTables} tables across ${sheetKeys.length} sheets, ${totalRows.toLocaleString()} rows total.`
          : 'Upload and process a workbook to see extracted table schemas, column types, and formula lineage here.'}</p>
      </div>

      {/* Section tabs */}
      <div className="ds-sub" style={{ marginBottom: 16 }}>
        <button className={sec === 'schema' ? 'on' : ''} onClick={() => setSec('schema')}>Structure</button>
        <button className={sec === 'rel' ? 'on' : ''} onClick={() => setSec('rel')}>Relationships ({displayRels.length + displayIntraRels.length})</button>
      </div>

      {sec === 'schema' && !hasLiveData && (
        <div style={{ color: 'var(--label-tertiary)', fontSize: 13, padding: '24px 16px', textAlign: 'center' }}>
          No data available. Upload and process a workbook to see table schemas here.
        </div>
      )}

      {sec === 'schema' && hasLiveData && (
        <div className="ds-accordion">
          {/* File level */}
          {list.map((f, fi) => (
            <div key={f.name || fi} className="ds-acc-file">
              <div className="ds-acc-file-head">
                <Icon name={f.kind === 'excel' ? 'sheet' : 'file'} size={15} />
                <span className="ds-acc-fname">{f.name}</span>
                <span className="ds-acc-badge">{f.kind === 'excel' ? 'XLSX' : 'PDF'}</span>
                <span className="ds-acc-meta">{sheetKeys.length} sheets</span>
              </div>

              {/* Sheet level */}
              {sheetKeys.map((sheetName) => {
                const sheetData = liveSheets[sheetName];
                const isSheetOpen = expandedSheets[sheetName];
                return (
                  <div key={sheetName} className="ds-acc-sheet">
                    <button className={'ds-acc-sheet-head' + (isSheetOpen ? ' open' : '')} onClick={() => toggleSheet(sheetName)}>
                      <Icon name={isSheetOpen ? 'chevronDown' : 'chevronRight'} size={13} className="ds-acc-chev" />
                      <Icon name="layers" size={14} />
                      <span className="ds-acc-sname">{sheetName}</span>
                      <span className="ds-acc-smeta">{sheetData.tables.length} table{sheetData.tables.length !== 1 ? 's' : ''} · {sheetData.rowCount.toLocaleString()} rows</span>
                    </button>
                    {isSheetOpen && sheetData.description && (
                      <div className="ds-acc-sdesc">{sheetData.description}</div>
                    )}

                    {/* Table level */}
                    {isSheetOpen && sheetData.tables.map((table, ti) => {
                      const tableKey = table.id || `${sheetName}_${ti}`;
                      const isTableOpen = expandedTables[tableKey];
                      const enrichInfo = enrichmentTableMap[table.id] || {};
                      const displayName = enrichInfo.entity || table.table_name || `Table ${ti + 1}`;
                      const displayDesc = enrichInfo.summary || enrichInfo.business_purpose || '';

                      return (
                        <div key={tableKey} className="ds-acc-table">
                          <button className={'ds-acc-table-head' + (isTableOpen ? ' open' : '')} onClick={() => toggleTable(tableKey)}>
                            <Icon name={isTableOpen ? 'chevronDown' : 'chevronRight'} size={12} className="ds-acc-chev" />
                            <Icon name="database" size={13} />
                            <span className="ds-acc-tname">{displayName}</span>
                            <span className="ds-acc-tmeta">{(table.n_rows || 0).toLocaleString()} rows × {(table.n_cols || (table.headers || []).length)} cols</span>
                          </button>
                          {isTableOpen && displayDesc && (
                            <div className="ds-acc-tdesc">{displayDesc}</div>
                          )}

                          {isTableOpen && (
                            <div className="ds-acc-tbody">
                              {/* Columns */}
                              <div className="ds-acc-section">
                                <div className="wb-label" style={{ marginTop: 0 }}>Columns ({(table.headers || []).length})</div>
                                <div className="dtable-wrap">
                                  <table className="dtable">
                                    <thead><tr><th>Column</th><th>Type</th><th>Sample</th></tr></thead>
                                    <tbody>{(table.headers || []).map((h) => {
                                      const sample = table.data && table.data[0] ? table.data[0][h] : null;
                                      return (
                                        <tr key={h}>
                                          <td className="k">{h}</td>
                                          <td className="t">{(table.dtypes && table.dtypes[h]) || '—'}</td>
                                          <td className="v">{sample != null ? String(sample).slice(0, 25) : '—'}</td>
                                        </tr>
                                      );
                                    })}</tbody>
                                  </table>
                                </div>
                              </div>

                              {/* Formulas (if any) */}
                              {table.formula_columns && table.formula_columns.length > 0 && (
                                <div className="ds-acc-section">
                                  <div className="wb-label" style={{ marginTop: 0 }}>Formulas ({table.formula_columns.length})</div>
                                  {table.formula_columns.map((fc) => (
                                    <div key={fc.column} className="mc-item">
                                      <div className="n">{fc.column}</div>
                                      <div className="e">{fc.pattern}</div>
                                      <div className="d">{fc.formula_count} cells{fc.references_sheets && fc.references_sheets.length > 0 ? ` · refs: ${fc.references_sheets.join(', ')}` : ''}</div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Data preview */}
                              {table.data && table.data.length > 0 && (
                                <div className="ds-acc-section">
                                  <div className="wb-label" style={{ marginTop: 0 }}>Data preview</div>
                                  <div className="dtable-wrap">
                                    <table className="dtable">
                                      <thead><tr>{(table.headers || []).slice(0, 7).map((h) => <th key={h}>{h}</th>)}</tr></thead>
                                      <tbody>{table.data.slice(0, 4).map((row, ri) => (
                                        <tr key={ri}>{(table.headers || []).slice(0, 7).map((h) => <td key={h} className="v">{row[h] != null ? String(row[h]).slice(0, 25) : '—'}</td>)}</tr>
                                      ))}</tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {sec === 'rel' && (
        <React.Fragment>
          {displayRels.length === 0 && displayIntraRels.length === 0 && (
            <div style={{ color: 'var(--label-tertiary)', fontSize: 13, padding: '24px 16px', textAlign: 'center' }}>
              No relationships detected.
            </div>
          )}
          {displayRels.length > 0 && (
            <React.Fragment>
              <div className="wb-label">Cross-sheet lineage ({displayRels.length})</div>
              {displayRels.map((r, i) => (
                <div key={i} className="rel">
                  <span className="ri"><Icon name="arrowRight" size={14} /></span>
                  <div><div className="rl">{r.a}<span className="ar">→</span>{r.b}</div><div className="rd">{r.d}</div></div>
                </div>
              ))}
            </React.Fragment>
          )}
          {displayIntraRels.length > 0 && (
            <React.Fragment>
              <div className="wb-label" style={{ marginTop: 18 }}>Within-sheet lineage ({displayIntraRels.length})</div>
              {displayIntraRels.map((r, i) => (
                <div key={i} className="rel">
                  <span className="ri"><Icon name="layers" size={14} /></span>
                  <div><div className="rl">{r.a}<span className="ar">→</span>{r.b}</div><div className="rd">{r.d}</div></div>
                </div>
              ))}
            </React.Fragment>
          )}
        </React.Fragment>
      )}
    </div>
  );
}

function ModelCardPane({ card, answers, calc, changes, questions, enrichment, extraction }) {
  const activeQuestions = questions || [];
  const answered = activeQuestions.filter((q) => answers && answers[q.id]);
  const c = calc || { drivers: '', output: '', formulas: '', notes: '' };

  // Extract structured data from enrichment
  const globalContext = enrichment && enrichment.global_context;
  const brief = globalContext && globalContext.brief;
  const purpose = globalContext && globalContext.purpose;
  const sheets = enrichment && enrichment.sheets;
  const crossRels = (enrichment && enrichment.cross_sheet_relationships) || [];

  // Build sheet → role map and sheet → tables map
  const sheetRoles = {};
  const sheetTables = {};
  if (sheets) {
    sheets.forEach((s) => {
      sheetRoles[s.sheet_name] = { role: s.sheet_role || 'data', reasoning: s.sheet_role_reasoning || '', summary: s.sheet_summary || '' };
      sheetTables[s.sheet_name] = (s.tables || []).map((t) => ({ id: t.table_id, entity: t.entity || t.table_id, summary: t.summary || '', purpose: t.business_purpose || '' }));
    });
  }

  // Resolve table_id → sheet name
  const tableToSheet = {};
  if (sheets) {
    sheets.forEach((s) => {
      (s.tables || []).forEach((t) => { if (t.table_id) tableToSheet[t.table_id] = s.sheet_name; });
    });
  }

  // Build graph for flow diagram
  const sheetNames = sheets ? sheets.map((s) => s.sheet_name) : [];
  const edges = crossRels.map((r) => ({
    from: tableToSheet[r.from_table_id] || r.from_table_id,
    to: tableToSheet[r.to_table_id] || r.to_table_id,
    type: r.relationship_type || '',
    desc: r.description || '',
    reasoning: r.reasoning || '',
    columns: r.shared_columns || [],
  }));

  // Topological layering for flow layout
  const layers = React.useMemo(() => {
    if (!sheetNames.length) return [];
    const incoming = {};
    sheetNames.forEach((n) => { incoming[n] = new Set(); });
    edges.forEach((e) => { if (incoming[e.to]) incoming[e.to].add(e.from); });

    const assigned = {};
    const result = [];
    let remaining = [...sheetNames];
    let layer = 0;
    while (remaining.length > 0 && layer < 10) {
      const thisLayer = remaining.filter((n) => {
        const deps = incoming[n] || new Set();
        return [...deps].every((d) => assigned[d] !== undefined);
      });
      if (thisLayer.length === 0) { result.push(remaining); break; } // cycle fallback
      thisLayer.forEach((n) => { assigned[n] = layer; });
      result.push(thisLayer);
      remaining = remaining.filter((n) => assigned[n] === undefined);
      layer++;
    }
    return result;
  }, [sheetNames.join(','), edges.length]);

  // Role colors — using app design tokens with dark-mode-friendly opacity
  const ROLE_COLORS = {
    input: { bg: 'rgba(52,199,89,0.12)', border: 'var(--c-green)', text: 'var(--c-green)' },
    reference: { bg: 'var(--pmi-blue-soft)', border: 'var(--pmi-blue)', text: 'var(--pmi-blue)' },
    calculation: { bg: 'rgba(255,149,0,0.12)', border: 'var(--c-orange)', text: 'var(--c-orange)' },
    output: { bg: 'rgba(92,214,242,0.12)', border: 'var(--pmi-cyan)', text: 'var(--pmi-cyan)' },
    data: { bg: 'var(--fill-tertiary)', border: 'var(--separator)', text: 'var(--label-secondary)' },
  };
  const getRoleColor = (sheetName) => {
    const role = (sheetRoles[sheetName] && sheetRoles[sheetName].role) || 'data';
    const key = role.toLowerCase().includes('input') || role.toLowerCase().includes('source') ? 'input'
      : role.toLowerCase().includes('reference') || role.toLowerCase().includes('lookup') ? 'reference'
      : role.toLowerCase().includes('calc') || role.toLowerCase().includes('engine') || role.toLowerCase().includes('model') ? 'calculation'
      : role.toLowerCase().includes('output') || role.toLowerCase().includes('result') ? 'output' : 'data';
    return ROLE_COLORS[key];
  };

  const hasFlowData = layers.length > 0 && edges.length > 0;

  return (
    <div>
      <div className="mc-head">
        <span className="mk"><Icon name="cube" size={22} /></span>
        <div style={{ minWidth: 0 }}>
          <h3>{card.name || 'New category'}</h3>
          <p>{card.owner} · updated {card.updated}</p>
        </div>
        <div className="mc-badges"><span>{card.version}</span><span>Draft</span></div>
      </div>

      {/* ═══ Executive Summary ═══ */}
      <div className="mc-sec">
        <h4><Icon name="brain" size={13} /> How this category works</h4>
        <div className="mc-body" style={{ lineHeight: 1.65 }}>{brief || purpose || (card.name ? `Pricing model for ${card.name}. The narrative will appear here once the workbook is analyzed.` : 'No summary available yet.')}</div>
        {globalContext && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {globalContext.total_sheets && <span className="mc-stat"><Icon name="layers" size={12} /> {globalContext.total_sheets} sheets</span>}
            {globalContext.total_tables && <span className="mc-stat"><Icon name="database" size={12} /> {globalContext.total_tables} tables</span>}
            {crossRels.length > 0 && <span className="mc-stat"><Icon name="arrowRight" size={12} /> {crossRels.length} connections</span>}
          </div>
        )}
      </div>

      {/* ═══ Data Flow Diagram ═══ */}
      {hasFlowData && (
        <div className="mc-sec">
          <h4><Icon name="arrowRight" size={13} /> Data Flow</h4>
          <div className="mc-flow">
            {layers.map((layer, li) => (
              <div key={li} className="mc-flow-layer">
                {li > 0 && <div className="mc-flow-arrows">
                  {edges.filter((e) => layers[li].includes(e.to) && layers[li - 1] && layers[li - 1].includes(e.from)).map((e, ei) => (
                    <div key={ei} className="mc-flow-edge">
                      <Icon name="arrowRight" size={11} />
                      <span>{e.type || 'feeds'}</span>
                    </div>
                  ))}
                  {edges.filter((e) => layers[li].includes(e.to) && layers[li - 1] && !layers[li - 1].includes(e.from)).length > 0 && (
                    <div className="mc-flow-edge"><Icon name="arrowRight" size={11} /><span>...</span></div>
                  )}
                </div>}
                <div className="mc-flow-nodes">
                  {layer.map((sheetName) => {
                    const color = getRoleColor(sheetName);
                    const tables = sheetTables[sheetName] || [];
                    const role = sheetRoles[sheetName];
                    return (
                      <div key={sheetName} className="mc-flow-node" style={{ background: color.bg, borderColor: color.border }}>
                        <div className="mc-flow-node-role" style={{ color: color.text }}>{role ? role.role : 'Data'}</div>
                        <div className="mc-flow-node-name">{sheetName.replace(/_/g, ' ')}</div>
                        {tables.length > 0 && (
                          <div className="mc-flow-node-tables">
                            {tables.slice(0, 3).map((t) => <span key={t.id}>{t.entity}</span>)}
                            {tables.length > 3 && <span>+{tables.length - 3} more</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="mc-flow-legend">
            {Object.entries(ROLE_COLORS).filter(([k]) => k !== 'data').map(([k, v]) => (
              <span key={k} className="mc-flow-legend-item"><span style={{ background: v.bg, borderColor: v.border }} />{k}</span>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Connections Detail ═══ */}
      {crossRels.length > 0 && (
        <div className="mc-sec">
          <h4><Icon name="layers" size={13} /> How the data connects ({crossRels.length})</h4>
          {crossRels.map((r, i) => {
            const fromSheet = tableToSheet[r.from_table_id] || '?';
            const toSheet = tableToSheet[r.to_table_id] || '?';
            return (
              <div key={i} className="mc-conn">
                <div className="mc-conn-path">
                  <span className="mc-conn-node from">{fromSheet}</span>
                  <span className="mc-conn-arrow"><Icon name="arrowRight" size={13} /></span>
                  <span className="mc-conn-node to">{toSheet}</span>
                  {r.relationship_type && <span className="mc-conn-type">{r.relationship_type}</span>}
                </div>
                <div className="mc-conn-desc">{r.description}</div>
                {r.reasoning && <div className="mc-conn-reason"><Icon name="brain" size={11} /> {r.reasoning}</div>}
                {r.shared_columns && r.shared_columns.length > 0 && (
                  <div className="mc-conn-cols">
                    <Icon name="database" size={11} /> Shared: {r.shared_columns.join(', ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ Sheet Roles ═══ */}
      {sheets && sheets.length > 0 && (
        <div className="mc-sec">
          <h4><Icon name="file" size={13} /> Sheet roles ({sheets.length})</h4>
          {sheets.map((s) => {
            const color = getRoleColor(s.sheet_name);
            const tables = s.tables || [];
            return (
              <div key={s.sheet_name} className="mc-sheet-role" style={{ borderLeftColor: color.border }}>
                <div className="mc-sr-head">
                  <span className="mc-sr-name">{s.sheet_name.replace(/_/g, ' ')}</span>
                  <span className="mc-sr-badge" style={{ background: color.bg, color: color.text }}>{s.sheet_role || 'Data'}</span>
                </div>
                {s.sheet_summary && <div className="mc-sr-summary">{s.sheet_summary}</div>}
                {tables.length > 0 && (
                  <div className="mc-sr-tables">
                    {tables.map((t) => (
                      <div key={t.table_id} className="mc-sr-table">
                        <span className="mc-sr-tentity">{t.entity || t.table_id}</span>
                        {t.summary && <span className="mc-sr-tsummary">{t.summary}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ Calculation & Drivers (owner-provided) ═══ */}
      {((c.drivers || '').trim() || (c.formulas || '').trim()) && (
        <div className="mc-sec">
          <h4><Icon name="gauge" size={13} /> Owner's description</h4>
          {[['What drives it', c.drivers], ['How it is computed', c.formulas], ['Where the output lives', c.output], ['Worth knowing', c.notes]]
            .filter(([, v]) => v && v.trim())
            .map(([k, v]) => (
              <div key={k} className="mc-item">
                <div className="d" style={{ marginTop: 0, color: 'var(--label-tertiary)' }}>{k}</div>
                <div className="n" style={{ marginTop: 6, fontFamily: 'var(--font-sans)', fontSize: 13, lineHeight: 1.6, fontWeight: 400 }}>{v}</div>
              </div>
            ))}
        </div>
      )}

      {/* ═══ Confirmed Knowledge ═══ */}
      {answered.length > 0 && (
        <div className="mc-sec">
          <h4><Icon name="check" size={13} /> Confirmed by the owner ({answered.length})</h4>
          {answered.map((q) => (
            <div key={q.id} className="mc-item">
              <div className="d" style={{ marginTop: 0, color: 'var(--label-tertiary)' }}>{q.question}</div>
              <div className="n" style={{ marginTop: 6, fontFamily: 'var(--font-sans)', fontSize: 13, lineHeight: 1.5, fontWeight: 400 }}>{answers[q.id]}</div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ Change Log ═══ */}
      {changes && changes.length > 0 && (
        <div className="mc-sec">
          <h4><Icon name="pencil" size={13} /> Change log ({changes.length})</h4>
          {changes.map((ch, i) => (
            <div key={i} className="chg"><span className="tm">{ch.time}</span><span>{ch.text}</span></div>
          ))}
        </div>
      )}
    </div>
  );
}

const STAGE_PLACEHOLDER = {
  3: {
    icon: 'shield', title: 'Run validation tests', body: 'The agent will replay your historical spend through the extracted model and compare its output against actuals — so you can see where the model agrees with reality before you approve it.',
    cards: [
      { i: 'gauge', h: 'Back-test accuracy', p: 'Model output vs. booked spend, per scenario and per supplier grade.' },
      { i: 'alert', h: 'Outlier detection', p: 'Lines where the reconstructed price deviates beyond tolerance.' },
      { i: 'refresh', h: 'Sensitivity runs', p: 'FX and benchmark index shocks applied to the confirmed formulas.' },
    ]
  },
  4: {
    icon: 'check', title: 'Review & approve', body: 'The final model card, the full audit trail, and the sign-off that publishes this category into the live pricing engine.',
    cards: [
      { i: 'file', h: 'Final model card', p: 'Everything confirmed across the previous three stages, in one document.' },
      { i: 'user', h: 'Approver routing', p: 'Category owner sign-off plus governance counter-signature.' },
      { i: 'zap', h: 'Publish to engine', p: 'Registers v1.0 and makes the category available to the DIM agent.' },
    ]
  },
};

function StagePlaceholderPane({ stage }) {
  const m = STAGE_PLACEHOLDER[stage];
  return (
    <div>
      <div className="pane-empty" style={{ margin: '40px auto 0', maxWidth: 520 }}>
        <div className="pe-ic"><Icon name={m.icon} size={26} /></div>
        <h4>{m.title}</h4>
        <p>{m.body}</p>
        <div className="pe-pre"><Icon name="clock" size={13} /> Coming soon</div>
      </div>
      <div className="soon-grid" style={{ maxWidth: 720, margin: '28px auto 0' }}>
        {m.cards.map((c) => (
          <div key={c.h} className="soon-card">
            <span className="sc-ic"><Icon name={c.i} size={16} /></span>
            <h5>{c.h}</h5><p>{c.p}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { PaneEmpty, DataSemanticPane, ModelCardPane, StagePlaceholderPane });
// categoryWorkbench.jsx — stage-1 task blocks, stage-2 confirmation list, processing skeletons
const { useState: useWS } = React;

// text field with an embedded dictate control (mic sits inside the field, far right)
function DictateField({ value, onChange, placeholder, dictation, multiline = true, rows = 2, action, onSubmit }) {
  const [rec, setRec] = useWS(false);
  const onKey = (e) => {
    if (e.key !== 'Enter' || e.shiftKey || !onSubmit) return;
    e.preventDefault();
    onSubmit();
  };
  function dictate() {
    if (rec) { setRec(false); return; }
    setRec(true);
    setTimeout(() => {
      setRec(false);
      const add = dictation || '';
      onChange(value.trim() ? value.trim() + ' ' + add : add);
    }, 2000);
  }
  return (
    <div className="dfield">
      {multiline
        ? <textarea rows={rows} value={value} placeholder={rec ? 'Listening…' : placeholder} onChange={(e) => onChange(e.target.value)} onKeyDown={onKey} />
        : <input className="dinput" value={value} placeholder={rec ? 'Listening…' : placeholder} onChange={(e) => onChange(e.target.value)} onKeyDown={onKey} />}
      <button className={'d-mic' + (rec ? ' rec' : '')} onClick={dictate} aria-label={rec ? 'Stop dictation' : 'Dictate'}>
        <Icon name="mic" size={15} />
      </button>
      {action}
      {rec && <div className="d-listening"><Icon name="mic" size={12} /> Listening — tap the mic to stop</div>}
    </div>
  );
}

function TaskBlock({ idx, title, summary, done, open, onOpen, children, hideEdit }) {
  if (!open) {
    return (
      <div className={'tb' + (done ? ' done' : '')}>
        <div className="tb-head">
          <span className="tb-idx">{done ? <Icon name="check" size={12} /> : idx}</span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="tb-t">{title}</div>
            {summary && <div className="tb-s">{summary}</div>}
          </div>
          {!hideEdit && <button className="tb-edit" onClick={onOpen}>{done ? <React.Fragment><Icon name="pencil" size={13} /> Edit</React.Fragment> : <React.Fragment>Open <Icon name="chevronRight" size={14} /></React.Fragment>}</button>}
        </div>
      </div>
    );
  }
  return (
    <div className="tb open">
      <div className="tb-head">
        <span className="tb-idx">{done ? <Icon name="check" size={12} /> : idx}</span>
        <div style={{ minWidth: 0, flex: 1 }}><div className="tb-t">{title}</div></div>
      </div>
      <div className="tb-body">{children}</div>
    </div>
  );
}

function UploadWorkbench(p) {
  const { name, setName, owner, setOwner, files, setFiles, onPick, onRemove,
    commercialClassification, setCommercialClassification, businessContext, setBusinessContext,
    scenarios, setScenario, addScenario, removeScenario, calc, setCalc, open, setOpen, next, readOnly,
    loadingStep, stepErrors } = p;

  const d1 = !!((name || '').trim() && (owner || '').trim());
  const d2 = files.length > 0;
  const scnDone = scenarios.filter((s) => s.q.trim() && s.a.trim()).length;
  const d3 = scnDone >= 1;
  const d4 = !!((calc.drivers || '').trim() && (calc.output || '').trim());
  const submit = (n, ok) => () => { if (ok && !readOnly && !loadingStep) next(n); };
  const onFieldKey = (ok, n) => (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (ok && !readOnly && !loadingStep) next(n); } };

  return (
    <div style={readOnly ? { opacity: 0.7, pointerEvents: 'none' } : undefined}>
      {readOnly && <div style={{ padding: '8px 12px', marginBottom: 12, background: 'rgba(0,156,222,0.08)', borderRadius: 6, fontSize: 12, color: 'var(--pmi-blue)' }}>Review mode — data has been processed. Go forward to continue.</div>}
      <TaskBlock idx={1} title="Category details" done={d1} open={readOnly || open === 1} onOpen={() => setOpen(1)} hideEdit={d1}
        summary={d1 ? `${name.trim()} · ${owner.trim()}` : 'Not set yet'}>
        <div className="wb-fields">
          <div className="fld"><label>Category name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={onFieldKey(d1, 1)} placeholder="e.g. Fine Paper Global Pulp" /></div>
          <div className="fld"><label>Category owner</label>
            <input value={owner} onChange={(e) => setOwner(e.target.value)} onKeyDown={onFieldKey(d1, 1)} placeholder="Owner name and role" /></div>
          <div className="fld"><label>Commercial impact classification</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[['deterministic', 'Deterministic (formula in file)'], ['nl_comments', 'Via NL / comments (no formula)'], ['mixed', 'Mixed']].map(([val, label]) => (
                <button key={val} className={'q-opt' + (commercialClassification === val ? ' sel' : '')} style={{ flex: 1, minWidth: 140, padding: '10px 12px', marginBottom: 0 }}
                  onClick={() => setCommercialClassification(val)}>
                  <span className="r" /><span style={{ fontSize: 12.5 }}>{label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="fld"><label>Category business context</label>
            <div className="dfield">
              <textarea rows={4} value={businessContext} onChange={(e) => setBusinessContext(e.target.value)}
                placeholder="Tell me about your category at a high level — how the price effect is achieved, what impacts it, how it's reported to PDCA…" />
            </div>
          </div>
        </div>
        <div className="tb-foot">
          <button className="gbtn primary" disabled={!d1 || loadingStep === 1} style={{ opacity: d1 ? 1 : 0.4 }} onClick={() => d1 && !loadingStep && next(1)}>
            {loadingStep === 1 ? <React.Fragment><Icon name="refresh" size={15} className="spin" /> Saving…</React.Fragment> : <React.Fragment><Icon name="check" size={15} /> Confirm</React.Fragment>}
          </button>
          {stepErrors && stepErrors[1] && <span className="step-error"><Icon name="alert" size={13} /> {stepErrors[1]}</span>}
        </div>
      </TaskBlock>

      <TaskBlock idx={2} title="Source files" done={d2} open={readOnly || open === 2} onOpen={() => setOpen(2)} hideEdit={d2}
        summary={files.length ? `${files.length} file${files.length > 1 ? 's' : ''} · ${files.map((f) => (f.kind === 'excel' ? 'XLSX' : 'PDF')).join(', ')}` : 'Nothing uploaded yet'}>
        <p className="tb-note">Excel or PDF. Whatever you actually open when someone asks you for a price on this category.</p>
        {files.map((f, i) => (
          <div key={f.name + i} className="file-card" style={{ flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
              <span className="fb">{f.kind === 'excel' ? 'XL' : 'PDF'}</span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="fn">{f.name}</div>
                <div className="fm">
                  <span>{f.size} MB</span>
                  {f.file_id && <span className="ok"><Icon name="check" size={12} /> Uploaded</span>}
                  {!f.file_id && !f.error && <span style={{ color: 'var(--label-tertiary)' }}>Ready</span>}
                  {f.error && <span style={{ color: 'var(--c-red)' }}>Failed</span>}
                </div>
              </div>
              <button className="fx" onClick={() => onRemove(i)} aria-label="Remove file"><Icon name="x" size={15} /></button>
            </div>
            {/* Per-file metadata */}
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr', paddingLeft: 48 }}>
              <div className="fld"><label style={{ fontSize: 11 }}>File purpose / role</label>
                <input style={{ fontSize: 12, padding: '7px 10px' }} value={f.purpose || ''} onChange={(e) => { const v = e.target.value; setFiles((prev) => prev.map((x, j) => j === i ? { ...x, purpose: v } : x)); }} placeholder="e.g. Supplier source file with prices" /></div>
              <div className="fld"><label style={{ fontSize: 11 }}>Owner</label>
                <input style={{ fontSize: 12, padding: '7px 10px' }} value={f.fileOwner || ''} onChange={(e) => { const v = e.target.value; setFiles((prev) => prev.map((x, j) => j === i ? { ...x, fileOwner: v } : x)); }} placeholder="e.g. Procurement team" /></div>
              <div className="fld"><label style={{ fontSize: 11 }}>Refresh frequency</label>
                <select className="cm-select"
                  value={f.refreshFrequency || ''} onChange={(e) => { const v = e.target.value; setFiles((prev) => prev.map((x, j) => j === i ? { ...x, refreshFrequency: v } : x)); }}>
                  <option value="">Select…</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                  <option value="adhoc">Ad-hoc</option>
                  <option value="onetime">One-time</option>
                </select></div>
              <div className="fld"><label style={{ fontSize: 11 }}>Source</label>
                <select className="cm-select"
                  value={f.sourceType || ''} onChange={(e) => { const v = e.target.value; setFiles((prev) => prev.map((x, j) => j === i ? { ...x, sourceType: v } : x)); }}>
                  <option value="">Select…</option>
                  <option value="supplier">Supplier</option>
                  <option value="internal_system">Internal System</option>
                  <option value="public_source">Public Source</option>
                  <option value="external_provider">External Data Provider</option>
                  <option value="other">Other</option>
                </select></div>
            </div>
          </div>
        ))}
        <label className="up-zone">
          <Icon name="download" size={22} />
          <span className="u1">Click to browse or drop a file here</span>
          <span className="u2">.xlsx (Excel)</span>
          <input type="file" accept=".xlsx" onChange={onPick} style={{ display: 'none' }} />
        </label>
        <div className="tb-foot">
          <button className="gbtn primary" disabled={!d2 || loadingStep === 2} style={{ opacity: d2 ? 1 : 0.4 }} onClick={() => d2 && !loadingStep && next(2)}>
            {loadingStep === 2 ? <React.Fragment><Icon name="refresh" size={15} className="spin" /> Uploading…</React.Fragment> : <React.Fragment><Icon name="check" size={15} /> Confirm</React.Fragment>}
          </button>
          {stepErrors && stepErrors[2] && <span className="step-error"><Icon name="alert" size={13} /> {stepErrors[2]}</span>}
        </div>
      </TaskBlock>

      <TaskBlock idx={3} title="Test Cases" done={d3} open={readOnly || open === 3} onOpen={() => setOpen(3)} hideEdit={d3}
        summary={scnDone ? `${scnDone} test case${scnDone > 1 ? 's' : ''} written` : 'No test cases yet'}>
        <p className="tb-note">These are the questions I'll be tested against once I've read your data. If I can answer them correctly, the model is doing its job. One is enough to continue — three gives me a much better read.</p>
        {scenarios.map((s, i) => {
          const filled = s.q.trim() && s.a.trim();
          const sample = SCENARIO_SAMPLES[i % SCENARIO_SAMPLES.length];
          return (
            <div key={i} className={'scn' + (filled ? ' filled' : '')}>
              <div className="scn-top">
                <span className="scn-idx">{filled ? <Icon name="check" size={11} /> : i + 1}</span>
                <span className="scn-lbl">Test Case {i + 1}</span>
                {scenarios.length > 1 && (
                  <button className="scn-del" onClick={() => removeScenario(i)} aria-label={'Delete test case ' + (i + 1)}><Icon name="x" size={14} /></button>
                )}
              </div>
              <div className="scn-grid">
                <div>
                  <span className="sub">Question</span>
                  <div className="dfield">
                    <textarea rows={2} value={s.q} onChange={(e) => setScenario(i, 'q', e.target.value)} placeholder={sample.q} />
                  </div>
                </div>
                <div>
                  <span className="sub">Expected answer</span>
                  <div className="dfield">
                    <textarea rows={2} value={s.a} onChange={(e) => setScenario(i, 'a', e.target.value)} placeholder={sample.a} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div className="tb-foot">
          {scenarios.length < 6 && <button className="scn-add" onClick={addScenario}><Icon name="plus" size={14} /> Add test case</button>}
          <button className="gbtn primary" disabled={!d3 || loadingStep === 3} style={{ opacity: d3 ? 1 : 0.4 }} onClick={() => d3 && !loadingStep && next(3)}>
            {loadingStep === 3 ? <React.Fragment><Icon name="refresh" size={15} className="spin" /> Saving…</React.Fragment> : <React.Fragment><Icon name="check" size={15} /> Confirm</React.Fragment>}
          </button>
          {stepErrors && stepErrors[3] && <span className="step-error"><Icon name="alert" size={13} /> {stepErrors[3]}</span>}
          <span className="hint">{scnDone} of {scenarios.length} complete · Enter to confirm, Shift + Enter for a new line</span>
        </div>
      </TaskBlock>

      <TaskBlock idx={4} title="The calculation" done={d4} open={readOnly || open === 4} onOpen={() => setOpen(4)} hideEdit={d4}
        summary={d4 ? (calc.drivers || '').trim().slice(0, 90) : 'Drivers and output not described yet'}>
        <p className="tb-note">In your own words. Dictate it if typing this much detail is a chore — I'd rather have the messy version than nothing.</p>
        {CALC_PROMPTS.map((c) => (
          <div key={c.id} style={{ marginBottom: 14 }}>
            <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--label-secondary)', marginBottom: 6 }}>{c.label}</span>
            <div className="dfield">
              <textarea rows={3} value={calc[c.id]} onChange={(e) => setCalc(c.id, e.target.value)} placeholder={c.ph} />
            </div>
          </div>
        ))}
        <div className="tb-foot">
          <button className="gbtn primary" disabled={!d4 || loadingStep === 4} style={{ opacity: d4 ? 1 : 0.4 }} onClick={() => d4 && !loadingStep && next(4)}>
            {loadingStep === 4 ? <React.Fragment><Icon name="refresh" size={15} className="spin" /> Saving…</React.Fragment> : <React.Fragment><Icon name="check" size={15} /> Confirm</React.Fragment>}
          </button>
          {stepErrors && stepErrors[4] && <span className="step-error"><Icon name="alert" size={13} /> {stepErrors[4]}</span>}
          <span className="hint">Drivers and output are required · Enter to confirm, Shift + Enter for a new line</span>
        </div>
      </TaskBlock>
    </div>
  );
}

function ConfirmWorkbench({ answers, onAnswer, onReopen, onEscalate, onExitEscalation, escalatedId, signoffs, onSignoff, onGoTab, questions, readOnly, wsQuestions, wsAnswered, wsConnected, wsProcessing, wsSendMessage, wsSendEdit, wsCoverage, wsTiers }) {
  const [free, setFree] = useWS({});
  const [defaultsExpanded, setDefaultsExpanded] = useWS(false);
  const [optionalExpanded, setOptionalExpanded] = useWS(false);
  const [endQs, setEndQs] = useWS({ outputs: '', customRules: '', responseFormat: '' });

  // Use WebSocket-driven questions when connected
  const useWsMode = wsConnected;

  // Read-only banner for viewing completed stages
  const readOnlyBanner = readOnly ? (
    <div style={{ padding: '12px 16px', marginBottom: 12, borderRadius: 12, background: 'var(--fill-tertiary)', display: 'flex', alignItems: 'center', gap: 8 }}>
      <Icon name="check" size={14} style={{ color: 'var(--c-green)' }} />
      <span style={{ fontSize: 13, color: 'var(--label-secondary)' }}>This stage is complete. You are viewing it in read-only mode.</span>
    </div>
  ) : null;

  if (useWsMode) {
    const { defaults, priority, optional, answered } = wsTiers;
    const totalOpen = defaults.length + priority.length + optional.length;
    const totalAll = totalOpen + answered.length;
    const blockingLeft = wsCoverage ? wsCoverage.blocking.open : priority.length;

    // Accept all defaults at once
    function acceptAllDefaults() {
      defaults.forEach((q) => wsSendEdit(q.anchor, null, 'confirmed'));
    }

    // Group defaults by table for display
    const defaultsByTable = {};
    defaults.forEach((q) => { (defaultsByTable[q.tableName] = defaultsByTable[q.tableName] || []).push(q); });

    return (
      <div>
        {readOnlyBanner}

        {/* Progress summary */}
        <div className="q-summary">
          {priority.length > 0
            ? <span className="q-pill open">{priority.length} question{priority.length > 1 ? 's' : ''} to answer</span>
            : <span className="q-pill done">All questions answered</span>}
          {wsProcessing && <span className="q-pill" style={{ background: 'var(--pmi-blue-soft)', color: 'var(--pmi-blue)' }}><Icon name="refresh" size={12} className="spin" /> Processing…</span>}
        </div>

        {/* ═══ TIER 1: Agent's Understanding (bulk-confirmable) ═══ */}
        {defaults.length > 0 && !readOnly && (
          <div className="q-card" style={{ padding: '16px 18px', marginBottom: 16, background: 'linear-gradient(140deg, rgba(52,199,89,0.06), rgba(52,199,89,0.02))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: defaultsExpanded ? 14 : 0 }}>
              <span style={{ width: 32, height: 32, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'rgba(52,199,89,0.15)', color: 'var(--c-green)' }}>
                <Icon name="check" size={16} />
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Agent understood {defaults.length} items</div>
                <div style={{ fontSize: 12, color: 'var(--label-secondary)' }}>Review and accept, or expand to check individually</div>
              </div>
              <button className="q-sug-chip" onClick={acceptAllDefaults} disabled={wsProcessing} style={{ fontWeight: 600 }}>
                <Icon name="check" size={13} /> Accept All Defaults
              </button>
              <button className="gbtn" onClick={() => setDefaultsExpanded((v) => !v)} style={{ fontSize: 12, padding: '6px 10px' }}>
                {defaultsExpanded ? 'Collapse' : 'Review'} <Icon name={defaultsExpanded ? 'chevronUp' : 'chevronDown'} size={12} />
              </button>
            </div>

            {defaultsExpanded && Object.entries(defaultsByTable).map(([tableName, items]) => (
              <div key={tableName} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--label-secondary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="database" size={12} /> {tableName}
                  <button style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: 'var(--c-green)', padding: '3px 8px', borderRadius: 999, background: 'rgba(52,199,89,0.12)' }}
                    onClick={() => items.forEach((q) => wsSendEdit(q.anchor, null, 'confirmed'))} disabled={wsProcessing}>
                    Accept group
                  </button>
                </div>
                {items.map((q) => (
                  <div key={q.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderTop: '0.5px solid var(--separator)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--label-secondary)' }}>{q.kindLabel}</div>
                      <div style={{ fontSize: 13, color: 'var(--label)', marginTop: 2 }}>{q.text}</div>
                    </div>
                    <button className="q-sug-chip" style={{ fontSize: 12, padding: '5px 10px', flexShrink: 0 }}
                      onClick={() => wsSendEdit(q.anchor, null, 'confirmed')} disabled={wsProcessing}>
                      <Icon name="check" size={11} /> Accept
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ═══ TIER 2: Needs Your Input (priority questions) ═══ */}
        {priority.length > 0 && (
          <div>
            <div className="wb-label"><Icon name="brain" size={13} /> Needs your input ({priority.length})</div>
            {priority.slice(0, 8).map((q, i) => {
              const val = free[q.id] || '';
              const isFocused = wsCoverage?.next_question?.anchor === q.anchor;
              return (
                <div key={q.id} className={'q-card' + (isFocused ? ' escalated' : '')}>
                  <div className="q-top">
                    <span className="q-idx">{i + 1}</span>
                    <span className="q-text">{q.displayQuestion}</span>
                    <span className="q-type">{q.kindLabel}</span>
                  </div>

                  {/* Context from detail */}
                  {q.detail.length > 0 && (
                    <div style={{ fontSize: 12.5, color: 'var(--label-secondary)', lineHeight: 1.5, margin: '0 0 10px 35px' }}>
                      {q.detail[0]}
                    </div>
                  )}

                  {/* Suggested answer chip */}
                  {q.hasSuggestion && (
                    <div className="q-suggestion">
                      <span className="q-sug-label">Suggested:</span>
                      <button className="q-sug-chip" onClick={() => wsSendEdit(q.anchor, null, 'confirmed')} disabled={readOnly || wsProcessing}>
                        <Icon name="check" size={12} /> {q.suggestedAnswer}
                      </button>
                    </div>
                  )}

                  {/* Free text input */}
                  {!readOnly && (
                    <div className="q-other">
                      <div className="dfield">
                        <input className="dinput" value={val} placeholder="Answer in your own words…"
                          onChange={(e) => setFree((f) => ({ ...f, [q.id]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === 'Enter' && val.trim()) { wsSendEdit(q.anchor, val.trim(), 'confirmed'); setFree((f) => ({ ...f, [q.id]: '' })); } }}
                        />
                        <button className="q-save" disabled={!val.trim() || wsProcessing} onClick={() => { wsSendEdit(q.anchor, val.trim(), 'confirmed'); setFree((f) => ({ ...f, [q.id]: '' })); }}>
                          <Icon name="check" size={14} /> Save
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Take up with agent */}
                  {!readOnly && (
                    <div className="q-actions">
                      <button className="q-esc" disabled={wsProcessing} onClick={() => {
                        wsSendMessage(`Help me understand: ${q.displayQuestion}${q.hasSuggestion ? ` — you suggested "${q.suggestedAnswer}", can you explain?` : ''}`);
                      }}>
                        <Icon name="chat" size={14} /> Take this up with the agent
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {priority.length > 8 && <div style={{ fontSize: 12, color: 'var(--label-tertiary)', textAlign: 'center', padding: 10 }}>+ {priority.length - 8} more will appear as you answer these</div>}
          </div>
        )}

        {/* ═══ TIER 3: Optional (non-blocking) ═══ */}
        {optional.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <button className="wb-label" onClick={() => setOptionalExpanded((v) => !v)} style={{ cursor: 'pointer', width: '100%' }}>
              <Icon name={optionalExpanded ? 'chevronDown' : 'chevronRight'} size={13} />
              {optional.length} optional questions (not required to continue)
            </button>
            {optionalExpanded && optional.map((q, i) => (
              <div key={q.id} className="q-card" style={{ opacity: 0.85 }}>
                <div className="q-top">
                  <span className="q-idx" style={{ background: 'var(--fill-quaternary)' }}>{i + 1}</span>
                  <span className="q-text">{q.displayQuestion}</span>
                  <span className="q-type">{q.kindLabel}</span>
                </div>
                {q.hasSuggestion && !readOnly && (
                  <div className="q-suggestion">
                    <span className="q-sug-label">Suggested:</span>
                    <button className="q-sug-chip" onClick={() => wsSendEdit(q.anchor, null, 'confirmed')} disabled={wsProcessing}>
                      <Icon name="check" size={12} /> {q.suggestedAnswer}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ═══ End-of-Interview Questions ═══ */}
        {!readOnly && priority.length === 0 && (
          <div style={{ marginTop: 16 }}>
            <div className="wb-label"><Icon name="chat" size={13} /> Final questions</div>
            <div className="q-card" style={{ marginBottom: 10 }}>
              <div className="q-top"><span className="q-idx">A</span><span className="q-text">Beyond total price effect and decomposition, which outputs should always appear in simulation responses for this category?</span></div>
              <div className="q-other"><div className="dfield"><textarea rows={2} value={endQs.outputs || ''} onChange={(e) => setEndQs((s) => ({ ...s, outputs: e.target.value }))} placeholder="e.g. Supplier-level spend breakdown, FX impact separately, volume variance…" /></div></div>
            </div>
            <div className="q-card" style={{ marginBottom: 10 }}>
              <div className="q-top"><span className="q-idx">B</span><span className="q-text">Are there any custom rules or business logic for this category that wasn't captured in any file?</span></div>
              <div className="q-other"><div className="dfield"><textarea rows={2} value={endQs.customRules || ''} onChange={(e) => setEndQs((s) => ({ ...s, customRules: e.target.value }))} placeholder="e.g. Quarterly index resets with 30-day lag, anything above 5% needs director sign-off…" /></div></div>
            </div>
            <div className="q-card" style={{ marginBottom: 10 }}>
              <div className="q-top"><span className="q-idx">C</span><span className="q-text">How should the agent typically structure its response when simulating this category?</span></div>
              <div className="q-other"><div className="dfield"><textarea rows={2} value={endQs.responseFormat || ''} onChange={(e) => setEndQs((s) => ({ ...s, responseFormat: e.target.value }))} placeholder="e.g. Start with total impact, then break down by supplier, show the index movement, end with commercial adjustments…" /></div></div>
            </div>
          </div>
        )}

        {/* ═══ Sign-off ═══ */}
        <div className="wb-label" style={{ marginTop: 22 }}><Icon name="check" size={13} /> Sign-off</div>
        <div className={'signoff' + (signoffs.semantic ? ' on' : '')}>
          <button className="box" onClick={() => onSignoff('semantic', !signoffs.semantic)} aria-label="Confirm data semantic"><Icon name="check" size={13} /></button>
          <div>
            <div className="st">I've reviewed the Data Semantic and it's correct.</div>
            <div className="sd">The schemas, column types, and lineage I extracted match how your data actually works.</div>
            <button className="jump" onClick={() => onGoTab('semantic')}>Open Data Semantic <Icon name="arrowRight" size={13} /></button>
          </div>
        </div>
        <div className={'signoff' + (signoffs.card ? ' on' : '')}>
          <button className="box" onClick={() => onSignoff('card', !signoffs.card)} aria-label="Confirm model card"><Icon name="check" size={13} /></button>
          <div>
            <div className="st">I confirm the Model Card is correct for now.</div>
            <div className="sd">For now — we come back to it after validation, and you can change anything by telling me.</div>
            <button className="jump" onClick={() => onGoTab('card')}>Open Model Card <Icon name="arrowRight" size={13} /></button>
          </div>
        </div>
      </div>
    );
  }

  // Fallback: original enrichment-based questions (when WS not connected)
  const activeQuestions = questions || [];
  const done = activeQuestions.filter((q) => answers[q.id]).length;
  const openCount = activeQuestions.length - done;

  return (
    <div>
      {readOnlyBanner}
      <div className="q-summary">
        <span className={'q-pill ' + (openCount ? 'open' : 'done')}>{openCount ? `${openCount} outstanding` : 'All questions confirmed'}</span>
        <span className="q-pill" style={{ background: 'var(--fill-tertiary)', color: 'var(--label-secondary)' }}>{done} of {activeQuestions.length} answered</span>
      </div>

      {activeQuestions.map((q, i) => {
        const ans = answers[q.id];
        if (ans) {
          return (
            <div key={q.id} className="q-card answered">
              <div className="q-collapsed">
                <span className="q-idx"><Icon name="check" size={12} /></span>
                <div className="qc-mid">
                  <div className="qc-q">{q.question}</div>
                  <div className="qc-a">{ans}</div>
                </div>
                {!readOnly && <button className="q-reopen" onClick={() => onReopen(q)}><Icon name="pencil" size={13} /> Change answer</button>}
              </div>
            </div>
          );
        }
        if (readOnly) {
          return (
            <div key={q.id} className="q-card">
              <div className="q-top">
                <span className="q-idx">{i + 1}</span>
                <span className="q-text">{q.question}</span>
                <span className="q-type">{q.type === 'open' ? 'Open' : 'Choice'}</span>
              </div>
              <div style={{ padding: '8px 16px', fontSize: 13, color: 'var(--label-tertiary)', fontStyle: 'italic' }}>Not answered yet</div>
            </div>
          );
        }
        const isEsc = escalatedId === q.id;
        const val = free[q.id] || '';
        return (
          <div key={q.id} className={'q-card' + (isEsc ? ' escalated' : '')}>
            <div className="q-top">
              <span className="q-idx">{i + 1}</span>
              <span className="q-text">{q.question}</span>
              <span className="q-type">{q.type === 'open' ? 'Open' : 'Choice'}</span>
            </div>

            {q.type === 'mc' && q.options.map((o) => (
              <button key={o} className="q-opt" onClick={() => onAnswer(q, o)}>
                <span className="r" /><span>{o}</span>
              </button>
            ))}

            <div className="q-other">
              <DictateField multiline={false} value={val} onChange={(v) => setFree((f) => ({ ...f, [q.id]: v }))}
                placeholder={q.type === 'mc' ? 'Or type your own answer…' : 'Answer in your own words…'} dictation={q.dictation || q.recommend}
                onSubmit={() => val.trim() && onAnswer(q, val.trim())}
                action={<button className="q-save" disabled={!val.trim()} onClick={() => onAnswer(q, val.trim())}><Icon name="check" size={14} /> Save</button>} />
            </div>

            {isEsc ? (
              <div className="val-resolving">
                <span className="vr-line"><Icon name="refresh" size={14} className="spin" /> We are trying to resolve question {String(i + 1).padStart(2, '0')} in the conversation.</span>
                <button className="gbtn" onClick={() => onExitEscalation()}><Icon name="x" size={14} /> Exit question resolution</button>
              </div>
            ) : (
              <div className="q-actions">
                <button className="q-esc" onClick={() => onEscalate(q)}><Icon name="chat" size={14} /> Take this up with the agent</button>
              </div>
            )}
          </div>
        );
      })}

      <div className="wb-label" style={{ marginTop: 22 }}><Icon name="check" size={13} /> Sign-off</div>
      <div className={'signoff' + (signoffs.semantic ? ' on' : '')}>
        <button className="box" onClick={() => onSignoff('semantic', !signoffs.semantic)} aria-label="Confirm data semantic"><Icon name="check" size={13} /></button>
        <div>
          <div className="st">I've reviewed the Data Semantic and it's correct.</div>
          <div className="sd">The schemas, column types, and lineage I extracted match how your data actually works.</div>
          <button className="jump" onClick={() => onGoTab('semantic')}>Open Data Semantic <Icon name="arrowRight" size={13} /></button>
        </div>
      </div>
      <div className={'signoff' + (signoffs.card ? ' on' : '')}>
        <button className="box" onClick={() => onSignoff('card', !signoffs.card)} aria-label="Confirm model card"><Icon name="check" size={13} /></button>
        <div>
          <div className="st">I confirm the Model Card is correct for now.</div>
          <div className="sd">For now — we come back to it after validation, and you can change anything by telling me.</div>
          <button className="jump" onClick={() => onGoTab('card')}>Open Model Card <Icon name="arrowRight" size={13} /></button>
        </div>
      </div>
    </div>
  );
}

function WorkbenchSkeleton() {
  return (
    <div className="skel-wrap">
      <div className="skel h1" />
      <div className="skel line w80" />
      <div className="skel line w60" />
      <div className="skel card" />
      <div className="skel tall" />
      <div className="skel line w80" />
      <div className="skel card" />
    </div>
  );
}

Object.assign(window, { UploadWorkbench, ConfirmWorkbench, WorkbenchSkeleton, DictateField, TaskBlock });
// categoryValidation.jsx — stage 3: run the owner's test cases against the model
const { useState: useVS } = React;

// test case 2 fails; a lone test case fails, so the correction flow is always demonstrable
const valFails = (i, n) => (n === 1 ? i === 0 : i === 1);

function TraceBlock({ trace, label }) {
  const [open, setOpen] = useVS(false);
  return (
    <div className={'val-trace' + (open ? ' open' : '')}>
      <button className="vt-head" onClick={() => setOpen((v) => !v)}>
        <Icon name="chevronRight" size={13} className={'chev' + (open ? ' open' : '')} />
        <Icon name="brain" size={14} />
        <span className="vt-t">{label || 'Reasoning trace'}</span>
        <span className="vt-n">{trace.length} steps · {trace.filter((t) => t.tools).length} tool calls</span>
      </button>
      {open && <div className="vt-body">{trace.map((item, i) => <ReasonItem key={i} item={item} toolsRunning={false} />)}</div>}
    </div>
  );
}

function ScenarioCard({ idx, scenario, state, onChange, onTakeUp, onExitResolution, resolving }) {
  const [open, setOpen] = useVS(!state.passed);
  const failed = !state.passed;
  const trace = state.passed ? (state.origFailed ? VAL_TRACE_FIXED : VAL_TRACE_PASS) : VAL_TRACE_FAIL;
  const miss = VAL_MISSES[idx % VAL_MISSES.length];
  const steps = state.passed ? VAL_PASS_STEPS : miss.steps;
  const num = String(idx + 1).padStart(2, '0');
  const canRun = !!state.comment.trim() && !state.running;

  function rerun() {
    if (!canRun) return;
    onChange({ running: true, lastRunFixedNothing: false });
    setTimeout(() => onChange({ running: false, passed: true, runs: state.runs + 1 }), 4200);
  }

  return (
    <div className={'val-card' + (state.passed ? ' pass' : ' fail') + (resolving ? ' resolving' : '') + (state.running ? ' running' : '')}>
      <button className="val-head" onClick={() => setOpen((v) => !v)}>
        <span className="vh-num">{state.running ? <Icon name="refresh" size={13} className="spin" /> : num}</span>
        <div className="vh-mid">
          <div className="vh-q">{scenario.q}</div>
          <div className="vh-meta">
            {state.running
              ? <span className="vm run">Re-running</span>
              : state.passed
                ? <span className="vm ok"><Icon name="check" size={12} /> Passed{state.origFailed ? ' after your correction' : ''}</span>
                : <span className="vm bad"><Icon name="alert" size={12} /> Failed</span>}
            {state.runs > 0 && !state.running && <span className="vm run">{state.runs} re-run{state.runs > 1 ? 's' : ''}</span>}
          </div>
        </div>
        <Icon name="chevronDown" size={16} className={'vh-chev' + (open ? ' open' : '')} />
      </button>

      {open && (state.running ? (
        <div className="val-body">
          <div className="val-runbar"><span /></div>
          <div className="val-runnote">
            <Icon name="clock" size={14} />
            <span>Re-running test case {num} against the corrected model. This can take a little while — you can work on another test case in the meantime.</span>
          </div>
          <div className="skel line w80" />
          <div className="skel line w60" />
          <div className="skel card" />
        </div>
      ) : (
        <div className="val-body">
          <div className="val-grid">
            <div className="val-cell q">
              <div className="vc-lbl">Your question</div>
              <div className="vc-val">{scenario.q}</div>
            </div>
            <div className={'val-cell' + (state.passed ? ' ok' : ' bad')}>
              <div className="vc-lbl">Agent Answer</div>
              <div className="vc-val">{state.passed ? scenario.a : miss.answer}</div>
              <div className="vc-lbl" style={{ marginTop: 12 }}>How I derived it</div>
              <ul className="val-steps">{steps.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
            <div className="val-cell exp">
              <div className="vc-lbl">Answer you expected</div>
              <div className="vc-val">{scenario.a}</div>
            </div>
          </div>

          {state.lastRunFixedNothing && <div className="val-why warn"><Icon name="alert" size={14} /> <span>Same result on the re-run — I need a correction from you before it can change.</span></div>}

          <TraceBlock trace={trace} />

          <div className="val-actions">
            <div className="vc-lbl">What should I correct?</div>
            <p className="val-hint">Open the reasoning trace above to see where my understanding went off, then give me the correct reasoning — the rule I should have followed.</p>
            <div className="val-fix">
              <DictateField multiline={false} value={state.comment} onChange={(v) => onChange({ comment: v })}
                placeholder={VAL_FIX_PROMPTS[idx % VAL_FIX_PROMPTS.length]} dictation={VAL_FIX_PROMPTS[idx % VAL_FIX_PROMPTS.length]}
                onSubmit={() => state.comment.trim() && onChange({ fixed: true })}
                action={<button className="q-save" disabled={!state.comment.trim()} onClick={() => onChange({ fixed: true })}><Icon name="check" size={14} /> Save</button>} />
            </div>

            {resolving ? (
              <div className="val-resolving">
                <span className="vr-line"><Icon name="refresh" size={14} className="spin" /> We are trying to resolve test case {num} in the conversation.</span>
                <button className="gbtn" onClick={onExitResolution}><Icon name="x" size={14} /> Exit test case resolution</button>
              </div>
            ) : (
              <div className="val-btnrow">
                <button className="gbtn" onClick={() => onTakeUp(idx, num)}><Icon name="chat" size={15} /> Take this test case up with the agent</button>
                <button className="gbtn primary" disabled={!canRun} style={{ opacity: canRun ? 1 : 0.4 }} onClick={rerun}>
                  <Icon name="refresh" size={15} /> Re-run test
                </button>
                {!state.comment.trim() && <span className="val-gate">Tell me what to correct first</span>}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ValidationWorkbench({ scenarios, states, onScenarioChange, onTakeUp, onExitResolution, resolvingIdx }) {
  const passed = states.filter((s) => s.passed).length;
  const outstanding = states.filter((s) => !s.passed).length;
  const running = states.filter((s) => s.running).length;
  return (
    <div>
      <div className="q-summary">
        <span className={'q-pill ' + (outstanding ? 'open' : 'done')}>{outstanding ? `${outstanding} failing` : 'All test cases passing'}</span>
        <span className="q-pill" style={{ background: 'var(--fill-tertiary)', color: 'var(--label-secondary)' }}>{passed} of {states.length} passed</span>
        {running > 0 && <span className="q-pill" style={{ background: 'var(--pmi-blue-soft)', color: 'var(--pmi-blue)' }}>{running} re-running</span>}
      </div>

      {scenarios.map((s, i) => (
        <ScenarioCard key={i} idx={i} scenario={s} state={states[i]}
          onChange={(patch) => onScenarioChange(i, patch)}
          onTakeUp={onTakeUp} onExitResolution={onExitResolution}
          resolving={resolvingIdx === i} />
      ))}
    </div>
  );
}

Object.assign(window, { ValidationWorkbench, ScenarioCard, TraceBlock, valFails });
// categoryOnboard.jsx — onboarding shell: welcome, step tracker, agent column, split work panes
const { useState: useOS, useEffect: useOE, useRef: useOR } = React;

let catMsgId = 0;
const nextMid = () => 'cm' + (++catMsgId);

// agent turn — the ProcureAI chat anatomy: thinking box with tool traces, then a soft word-stream
function AgentMessage({ blocks, reasoning, motion = 7, animate = true, chips, onChip, onDone }) {
  const flow = reasoning || [];
  const total = blocks.reduce((n, b) => n + b.text.split(' ').length, 0);
  const speed = Math.max(14, 60 - motion * 5);
  const [phase, setPhase] = useOS(animate ? (flow.length > 0 ? 'reasoning' : 'streaming') : 'done');
  const [items, setItems] = useOS(animate ? 0 : flow.length);
  const [doneTools, setDoneTools] = useOS(animate ? 0 : flow.length);
  const [revealed, setRevealed] = useOS(animate ? 0 : total);

  useOE(() => {
    if (!animate) return;
    const timers = [];
    let t = 200;
    flow.forEach((item, i) => {
      timers.push(setTimeout(() => setItems(i + 1), t));
      t += 470;
      if (item.tools || item.tool) { timers.push(setTimeout(() => setDoneTools(i + 1), t)); t += 520; }
      else timers.push(setTimeout(() => setDoneTools(i + 1), t));
    });
    timers.push(setTimeout(() => setPhase('streaming'), t + 100));
    return () => timers.forEach(clearTimeout);
  }, []);

  useOE(() => {
    if (phase !== 'streaming') return;
    if (revealed >= total) { setPhase('done'); onDone && onDone(); return; }
    const tm = setTimeout(() => setRevealed((r) => r + 1), speed);
    return () => clearTimeout(tm);
  }, [phase, revealed]);

  return (
    <div className="msg msg-ai">
      <div className="ai-row">
        <span className="ai-avatar"><Icon name="sparkles" size={17} /></span>
        <div className="ai-content">
          {flow.length > 0 && <ThinkingBlock flow={flow} revealedItems={items} doneTools={doneTools} active={phase === 'reasoning'} animate={animate} />}
          {(phase !== 'reasoning' || flow.length === 0) && <AnswerBody blocks={blocks} revealed={revealed} streaming={phase === 'streaming'} />}
          {phase === 'done' && chips && chips.length > 0 && (
            <div className="ob-chips">
              {chips.map((c) => (
                <button key={c.act} className="ob-chip" onClick={() => onChip(c)}>
                  <Icon name={c.icon || 'arrowRight'} size={15} className="ci" /> {c.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProcessingCard({ pct, flavour, done, status, error }) {
  const failed = status === 'FAILED';

  return (
    <div className={'proc-card' + (done && !failed ? ' done' : '') + (failed ? ' failed' : '')}>
      <div className="pc-head">
        {done && !failed ? <Icon name="check" size={16} className="ok" /> : failed ? <Icon name="alert" size={16} style={{ color: 'var(--c-red, #ff3b30)' }} /> : <Icon name="refresh" size={16} className="spin" style={{ color: 'var(--pmi-blue)' }} />}
        {done && !failed ? 'Processing complete' : failed ? 'Processing failed' : 'Processing your workbook'}
      </div>
      {!done && !failed && (
        <div className="pc-note" style={{ marginTop: 6 }}>
          See the workbench panel for detailed progress. This takes 5-10 minutes.
        </div>
      )}
      {failed && error && <div className="pc-note" style={{ color: 'var(--c-red, #ff3b30)', marginTop: 6 }}>{error}</div>}
      {done && !failed && <div className="pc-note" style={{ marginTop: 6 }}>Your workbook has been analyzed. Moving to the next stage…</div>}
    </div>
  );
}

// ---------- stage 0: agent-led welcome ----------
function OnboardWelcome({ motion, onStart, onExit }) {
  const nomo = motion === 0;
  const [step, setStep] = useOS(nomo ? 5 : 0);
  useOE(() => {
    if (nomo) return;
    const t = [1, 2, 3, 4, 5].map((n, i) => setTimeout(() => setStep(n), 2600 + i * 700));
    return () => t.forEach(clearTimeout);
  }, []);
  return (
    <div className="ob-welcome">
      <div className="ob-welcome-inner">
        <div className="ow-lead">
          <AnswerBodyStream blocks={WELCOME_LEAD} motion={motion} animate={!nomo} />
        </div>

        {step >= 1 && (
          <div className="ow-widget">
            <div className="ow-wlabel">How long this takes</div>
            <div className="ow-duration">
              <span className="di"><Icon name="clock" size={20} /></span>
              <div>
                <div className="dv">~30 minutes</div>
                <div className="db">A working session, not a form. It moves at the speed you can explain your own data.</div>
              </div>
            </div>
          </div>
        )}

        {step >= 2 && (
          <div className="ow-widget">
            <div className="ow-wlabel">Four stages of knowledge transfer</div>
            <div className="ow-stagegrid">
              {CAT_STAGES.map((s) => (
                <div key={s.n} className="ow-stage" data-screen-label={'Stage ' + s.n}>
                  <span className="sn">{s.n}</span>
                  <div className="st">{s.label}</div>
                  <div className="sm">{s.mins}</div>
                  <div className="sd">{s.detail}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step >= 3 && (
          <div className="ow-widget">
            <div className="ow-wlabel">What we build together</div>
            <div className="ow-outputs">
              {WELCOME_OUTPUTS.map((o) => (
                <div key={o.t} className="ow-output">
                  <div className="oo-top">
                    <span className="oi"><Icon name={o.icon} size={18} /></span>
                    <div className="ot">{o.t}</div>
                    <span className="otag">{o.tag}</span>
                  </div>
                  <div className="ob">{o.b}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step >= 4 && (
          <div className="ow-widget">
            <div className="ow-wlabel">Rules of the road</div>
            <div className="ow-rules">
              {WELCOME_RULES.map((r) => (
                <div key={r.t} className="ow-rule">
                  <span className="ri"><Icon name={r.icon} size={16} /></span>
                  <div><div className="rt">{r.t}</div><div className="rb">{r.b}</div></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step >= 5 && (
          <div className="ow-widget ow-actions">
            <button className="gbtn primary" onClick={onStart}>Start onboarding <Icon name="arrowRight" size={15} /></button>
            <button className="gbtn" onClick={onExit}>Not now</button>
          </div>
        )}
      </div>
    </div>
  );
}

// bare streamed paragraph — no avatar, no thinking box
function AnswerBodyStream({ blocks, motion = 7, animate = true }) {
  const total = blocks.reduce((n, b) => n + b.text.split(' ').length, 0);
  const speed = Math.max(14, 60 - motion * 5);
  const [revealed, setRevealed] = useOS(animate ? 0 : total);
  useOE(() => {
    if (!animate || revealed >= total) return;
    const tm = setTimeout(() => setRevealed((r) => r + 1), speed);
    return () => clearTimeout(tm);
  }, [revealed]);
  return <AnswerBody blocks={blocks} revealed={revealed} streaming={animate && revealed < total} />;
}

function CategoryOnboard({ islandVariant, motion = 7, onExit, resumeCategory }) {
  const [stage, setStage] = useOS(resumeCategory ? -1 : 0); // -1 = loading/resuming
  const [maxStage, setMaxStage] = useOS(0);
  const [pane, setPane] = useOS('work');
  const [messages, setMessages] = useOS([]);
  const [input, setInput] = useOS('');

  const [name, setName] = useOS(resumeCategory ? (resumeCategory.name || '') : '');
  const [owner, setOwner] = useOS(resumeCategory ? (resumeCategory.owner || '') : '');
  const [files, setFiles] = useOS([]);
  const [scenarios, setScenarios] = useOS(Array.from({ length: SCENARIO_COUNT }, () => ({ q: '', a: '' })));
  const [calc, setCalcState] = useOS({ drivers: '', output: '', formulas: '', notes: '' });
  const [block, setBlock] = useOS(1);

  const [answers, setAnswers] = useOS({});
  const [signoffs, setSignoffs] = useOS({ semantic: false, card: false });
  const [esc, setEsc] = useOS(null); // { id, proposal }
  const [valStates, setValStates] = useOS(null);
  const [valEsc, setValEsc] = useOS(null); // { idx, num }
  const [changes, setChanges] = useOS([]);

  const [proc, setProc] = useOS(null);
  const [procSheets, setProcSheets] = useOS([]); // [{name, status: 'pending'|'running'|'done'|'failed', tables, toolCalls}]
  const scrollRef = useOR(null);
  const pinRef = useOR(null);
  const seeded = useOR({});
  const nomo = motion === 0;

  // ─── Backend integration state ───
  const [categoryId, setCategoryId] = useOS(resumeCategory ? resumeCategory.category_id : null);
  const [fileId, setFileId] = useOS(null);
  const [apiError, setApiError] = useOS(null);
  const [interviewSessionId, setInterviewSessionId] = useOS(null);
  const [interviewAgentUrl, setInterviewAgentUrl] = useOS(null);
  const [commercialClassification, setCommercialClassification] = useOS('');
  const [businessContext, setBusinessContext] = useOS('');

  // ─── Per-step loading & error state for Category Definition ───
  const [loadingStep, setLoadingStep] = useOS(null); // which step (1–4) is currently loading
  const [stepErrors, setStepErrors] = useOS({}); // { [stepNumber]: "error message" }

  // ─── Dynamic data from pipeline (replaces static mocks when available) ───
  const [liveExtraction, setLiveExtraction] = useOS(null); // extraction tables from JSON 1
  const [liveEnrichment, setLiveEnrichment] = useOS(null); // enrichment from JSON 2
  const [liveQuestions, setLiveQuestions] = useOS(null); // interview questions from enrichment

  // ─── Interview Agent WebSocket state ───
  const wsRef = useOR(null);
  const [wsConnected, setWsConnected] = useOS(false);
  const [wsNoteBlocks, setWsNoteBlocks] = useOS([]); // NoteBlock[] from ServerDocument
  const [wsHeadings, setWsHeadings] = useOS([]); // HeadingBlock[] for name resolution
  const [wsCoverage, setWsCoverage] = useOS(null); // { blocking, non_blocking, can_finish, next_question }
  const [wsProcessing, setWsProcessing] = useOS(false); // true while waiting for a turn response
  const clientRefCounter = useOR(0);

  function nextClientRef() { clientRefCounter.current += 1; return `c${clientRefCounter.current}`; }

  // Build a table name lookup from heading blocks: anchor_target → display name
  const wsTableNames = React.useMemo(() => {
    const map = {};
    wsHeadings.forEach((h) => {
      if (h.level === 3 && h.block_id && h.block_id.startsWith('heading:table:')) {
        const tableId = h.block_id.replace('heading:table:', '');
        map[tableId] = h.text;
      }
    });
    return map;
  }, [wsHeadings]);

  // Derive questions from wsNoteBlocks — split into tiers
  const wsTiers = React.useMemo(() => {
    if (!wsNoteBlocks.length) return { defaults: [], priority: [], optional: [], answered: [] };

    const defaults = []; // Agent's suggestions (unsure state)
    const priority = []; // Only genuinely OPEN questions the agent can't answer
    const answered = []; // Already confirmed

    const KIND_LABELS = { grain: 'Table Meaning', measure_definition: 'Measure', exclusion: 'Exclusion', relationship: 'Relationship', rule: 'Rule', free_note: 'Note' };

    wsNoteBlocks.forEach((b) => {
      if (b.kind !== 'note') return;
      const anchorParts = (b.anchor || '').split('.');
      const target = anchorParts[0] === 'rel' ? anchorParts[1] : anchorParts[0] === 'overall' ? '' : anchorParts[0];
      const tableName = wsTableNames[target] || target.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const kindLabel = KIND_LABELS[b.note_kind] || 'Note';

      const item = {
        id: b.anchor,
        anchor: b.anchor,
        tableName,
        kindLabel,
        kind: b.note_kind,
        state: b.state,
        text: b.text,
        detail: b.detail || [],
        isBlocking: true,
        hasSuggestion: b.state === 'unsure' && b.text && b.text !== 'Nothing written here yet.',
        suggestedAnswer: (b.state === 'unsure' && b.text && b.text !== 'Nothing written here yet.') ? b.text : null,
        displayQuestion: `${tableName} — ${kindLabel}`,
      };

      if (b.state === 'confirmed') { answered.push(item); return; }
      // Only show genuinely OPEN questions (agent doesn't know the answer)
      if (b.state === 'open') { priority.push(item); return; }
      // Unsure items = agent has a suggestion but isn't sure → show as defaults (bulk-confirmable)
      if (b.state === 'unsure') { defaults.push(item); return; }
    });

    return { defaults, priority, optional: [], answered };
  }, [wsNoteBlocks, wsTableNames]);

  // Auto-confirm is handled by the backend's auto_confirm_pass (runs on session creation)
  // Frontend just shows whatever questions remain after the backend's pass
  const autoConfirmedRef = useOR(false);
  const autoConfirmingRef = useOR(false);

  // Keep old wsQuestions/wsAnswered for backward compat
  const wsQuestions = React.useMemo(() => wsTiers.priority, [wsTiers]);
  const wsAnswered = React.useMemo(() => wsTiers.answered, [wsTiers]);

  // Connect WebSocket when Stage 2 + interviewSessionId available
  // Includes exponential backoff reconnection and strict-mode guard
  const wsConnectAttempt = useOR(0);
  const wsIntentionalClose = useOR(false);

  useOE(() => {
    if (stage !== 2 || !interviewSessionId) return;

    // Guard against React strict mode double-mount
    let mounted = true;
    wsIntentionalClose.current = false;
    wsConnectAttempt.current = 0;

    function connect() {
      if (!mounted) return;

      // Close any existing connection first
      if (wsRef.current) { try { wsRef.current.close(); } catch {} wsRef.current = null; }

      const base = 'wss://dimp-dev.dimp-dev.aws.private-pmideep.biz';
      const url = `${base}/api/interview_agent/v1/ws/sessions/${interviewSessionId}`;
      let ws;
      try { ws = new WebSocket(url); } catch (e) { console.warn('WS connect failed:', e); scheduleReconnect(); return; }
      wsRef.current = ws;

      // Keep-alive ping every 30 seconds
      let pingInterval = null;

      ws.onopen = () => {
        if (!mounted) { ws.close(); return; }
        wsConnectAttempt.current = 0; // Reset backoff on successful connect
        setWsConnected(true);
        pingInterval = setInterval(() => {
          if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'ping', client_ref: null }));
        }, 30000);
      };
      ws.onclose = () => {
        setWsConnected(false);
        wsRef.current = null;
        if (pingInterval) clearInterval(pingInterval);
        // Reconnect unless this was intentional cleanup
        if (mounted && !wsIntentionalClose.current) scheduleReconnect();
      };
      ws.onerror = (e) => { console.warn('WS error:', e); };
      ws.onmessage = (event) => {
        let msg;
        try { msg = JSON.parse(event.data); } catch { return; }
        if (msg.type === 'pong' || msg.type === 'heartbeat') return;
        handleWsMessage(msg);
      };
    }

    function scheduleReconnect() {
      if (!mounted || wsIntentionalClose.current) return;
      const attempt = wsConnectAttempt.current;
      // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
      const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
      wsConnectAttempt.current = attempt + 1;
      setTimeout(() => { if (mounted && !wsIntentionalClose.current) connect(); }, delay);
    }

    connect();

    return () => {
      mounted = false;
      wsIntentionalClose.current = true;
      if (wsRef.current) { try { wsRef.current.close(); } catch {} wsRef.current = null; }
      setWsConnected(false);
    };
  }, [stage, interviewSessionId]);

  function handleWsMessage(msg) {
    switch (msg.type) {
      case 'document':
        setWsNoteBlocks(msg.document?.blocks?.filter((b) => b.kind === 'note') || []);
        setWsHeadings(msg.document?.blocks?.filter((b) => b.kind === 'heading') || []);
        break;
      case 'block_update':
        setWsNoteBlocks((prev) => {
          const idx = prev.findIndex((b) => b.anchor === msg.anchor);
          if (msg.block?.removed) return prev.filter((b) => b.anchor !== msg.anchor);
          const updated = { ...msg.block, kind: 'note' };
          if (idx >= 0) return prev.map((b, i) => i === idx ? updated : b);
          return [...prev, updated];
        });
        setWsProcessing(false);
        break;
      case 'coverage':
        setWsCoverage({ blocking: msg.blocking, non_blocking: msg.non_blocking, can_finish: msg.can_finish, next_question: msg.next_question });
        break;
      case 'chat':
        if (msg.text) push(agent([{ type: 'p', text: msg.text }], { reasoning: null }));
        setWsProcessing(false);
        break;
      case 'ack':
        // Turn received, processing
        setWsProcessing(true);
        break;
      case 'transcript':
        // Restore conversation on reconnect
        if (msg.utterances && msg.utterances.length) {
          const restored = msg.utterances.map((u) => ({
            id: nextMid(),
            kind: u.speaker === 'agent' ? 'agent' : 'user',
            ...(u.speaker === 'agent' ? { blocks: [{ type: 'p', text: u.text }], done: true } : { text: u.text }),
          }));
          setMessages((prev) => prev.length === 0 ? restored : prev);
        }
        break;
      case 'proposal':
        // Agent is proposing a change — auto-approve for now (single-line changes)
        if (wsRef.current && wsRef.current.readyState === 1) {
          wsRef.current.send(JSON.stringify({ type: 'confirm', client_ref: nextClientRef(), proposal_id: msg.proposal_id, approved: true }));
        }
        break;
      case 'error':
        setApiError(msg.message);
        setWsProcessing(false);
        break;
      default:
        break;
    }
  }

  function wsSendMessage(text) {
    if (!wsRef.current || wsRef.current.readyState !== 1 || !text.trim()) return;
    const ref = nextClientRef();
    wsRef.current.send(JSON.stringify({ type: 'message', client_ref: ref, text: text.trim() }));
    push(user(text.trim()));
    // Safety: reset processing state after 30s if no response comes back
    setTimeout(() => setWsProcessing((p) => p ? false : p), 30000);
  }

  function wsSendEdit(anchor, value, state) {
    if (!wsRef.current || wsRef.current.readyState !== 1) return;
    const ref = nextClientRef();
    wsRef.current.send(JSON.stringify({ type: 'edit', client_ref: ref, anchor, value: value || null, state: state || 'confirmed' }));
  }

  function wsDeferQuestion(questionId, reason) {
    if (!wsRef.current || wsRef.current.readyState !== 1) return;
    const ref = nextClientRef();
    wsRef.current.send(JSON.stringify({ type: 'defer', client_ref: ref, question_id: questionId, reason }));
  }

  // When categoryId becomes available, upload any files that were added before
  useOE(() => {
    if (!categoryId || !files.length) return;
    const pending = files.filter((f) => !f.file_id && !f.uploading && !f.error);
  }, [categoryId]);

  // ─── Resume: if opening an existing category, fetch its data and jump to appropriate stage ───
  useOE(() => {
    if (!resumeCategory || !resumeCategory.category_id) { if (stage === -1) setStage(0); return; }
    let alive = true;
    (async () => {
      const cid = resumeCategory.category_id;
      const ONBOARDING_BASE = import.meta.env.VITE_ONBOARDING_API_URL || '';
      try {
        const cardRes = await fetch(`${ONBOARDING_BASE}/api/onboarding_service/v1/model-cards/${cid}`);
        if (!cardRes.ok || !alive) { setStage(0); return; }
        const card = await cardRes.json();

        // Restore name and owner from the model card (critical for page-reload resume)
        if (card.category_name) setName(card.category_name);
        if (card.category_owner) setOwner(card.category_owner);
        if (card.commercial_classification) setCommercialClassification(card.commercial_classification);
        if (card.business_context) setBusinessContext(card.business_context);

        // Restore test cases
        if (card.test_cases && card.test_cases.length > 0) {
          setScenarios(card.test_cases.map((tc) => ({ q: tc.question || '', a: tc.answer || '' })));
        }
        // Restore calculations (handle both programmatic keys and label keys from backend)
        if (card.calculations && card.calculations.length > 0) {
          const c = card.calculations[0];
          setCalcState({
            drivers: c.inputs_and_drivers || c['What are the inputs and drivers?'] || c.drivers || '',
            output: c.output_location || c['Where do I find the output?'] || c.output || '',
            formulas: c.formulas || c['What are the typical formulas used to compute it?'] || '',
            notes: c.notes || '',
          });
        }
        // Restore confirmed answers
        if (card.confirmed_answers) setAnswers(card.confirmed_answers);

        // Restore files early (needed for stage1Ready check and to prevent re-upload)
        if (card.files && card.files.length > 0) {
          setFiles(card.files.map((f) => ({ name: f.filename, size: 0, kind: 'excel', file_id: f.file_id })));
          setFileId(card.files[0].file_id);
        }

        // Advance the block (open task) to the first incomplete step
        const hasName = !!(card.category_name || '').trim() && !!(card.category_owner || '').trim();
        const hasFiles = card.files && card.files.length > 0;
        const hasTestCases = card.test_cases && card.test_cases.length > 0 && card.test_cases.some((tc) => (tc.question || '').trim() && (tc.answer || '').trim());
        const hasCalc = card.calculations && card.calculations.length > 0 && !!((card.calculations[0].inputs_and_drivers || card.calculations[0].drivers || '').trim()) && !!((card.calculations[0].output_location || card.calculations[0].output || '').trim());
        const firstIncomplete = !hasName ? 1 : !hasFiles ? 2 : !hasTestCases ? 3 : !hasCalc ? 4 : 0;
        setBlock(firstIncomplete || 0);

        // Check if extraction/enrichment is available
        const hasExtraction = !!card.extraction_jsonl_s3_path;
        const hasEnrichment = !!card.enrichment_json_s3_path;

        if (hasExtraction && hasEnrichment) {
          // Fetch extraction + enrichment
          const [extRes, enrRes] = await Promise.all([
            fetch(`${ONBOARDING_BASE}/api/onboarding_service/v1/model-cards/${cid}/extraction`).then(r => r.ok ? r.json() : null).catch(() => null),
            fetch(`${ONBOARDING_BASE}/api/onboarding_service/v1/model-cards/${cid}/enrichment`).then(r => r.ok ? r.json() : null).catch(() => null),
          ]);
          if (!alive) return;

          if (extRes && extRes.tables) setLiveExtraction(extRes.tables);
          if (enrRes && enrRes.enrichment) {
            setLiveEnrichment(enrRes.enrichment);
            const iq = enrRes.enrichment.interview_questions || {};
            const allQs = [];
            (iq.high_level || []).forEach((q, i) => { allQs.push({ id: `hl_${i}`, type: 'open', question: typeof q === 'string' ? q : q.question, recommend: '', why: typeof q === 'string' ? '' : (q.rationale || ''), hint: 'Answer in your own words.' }); });
            (iq.low_level || []).forEach((q, i) => { allQs.push({ id: `ll_${i}`, type: 'open', question: typeof q === 'string' ? q : q.question, recommend: '', why: typeof q === 'string' ? '' : (q.rationale || ''), hint: typeof q === 'string' ? '' : (q.target_sheet ? `Relates to: ${q.target_sheet}` : '') }); });
            if (allQs.length > 0) setLiveQuestions(allQs);
          }

          // Jump to the right stage — extraction is done, go to Stage 2 or 3
          if (card.stage2_completed) {
            setStage(3); setMaxStage(3);
            seeded.current[1] = true; seeded.current[2] = true; seeded.current[3] = true;
          } else {
            setStage(2); setMaxStage(2);
            seeded.current[1] = true; seeded.current[2] = true;
          }

          // Start interview session for resumed category (handle 409 if already active)
          try {
            // First check if there's already an active session for this category
            const listRes = await fetch(`${INTERVIEW_AGENT_BASE}/api/interview_agent/v1/sessions`);
            let existingSessionId = null;
            if (listRes.ok) {
              const listData = await listRes.json();
              const found = (listData.categories || []).find((c) => c.category_id === cid && c.session_id);
              if (found) existingSessionId = found.session_id;
            }
            if (existingSessionId) {
              // Try to resume the saved session (brings it back into memory)
              try {
                await fetch(`${INTERVIEW_AGENT_BASE}/api/interview_agent/v1/sessions/${existingSessionId}/resume`, { method: 'POST' });
              } catch {}
              setInterviewSessionId(existingSessionId);
            } else {
              const sessRes = await fetch(`${INTERVIEW_AGENT_BASE}/api/interview_agent/v1/sessions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Actor': resumeCategory.owner || 'category_manager' },
                body: JSON.stringify({ category_id: cid }),
              });
              if (sessRes.ok) {
                const sessData = await sessRes.json();
                setInterviewSessionId(sessData.session?.session_id || null);
              } else if (sessRes.status === 409) {
                // Session already exists but wasn't in the list — try resume directly
                const retryList = await fetch(`${INTERVIEW_AGENT_BASE}/api/interview_agent/v1/sessions`);
                if (retryList.ok) {
                  const retryData = await retryList.json();
                  const found = (retryData.categories || []).find((c) => c.category_id === cid && c.session_id);
                  if (found) {
                    try { await fetch(`${INTERVIEW_AGENT_BASE}/api/interview_agent/v1/sessions/${found.session_id}/resume`, { method: 'POST' }); } catch {}
                    setInterviewSessionId(found.session_id);
                  }
                }
              }
            }
          } catch (err) {
            console.warn('Interview session on resume failed (non-critical):', err.message);
          }
        } else if (card.files && card.files.length > 0) {
          // Files exist but extraction not done yet — check if a job is currently running
          let activeJob = null;
          const jobIds = card.job_ids || [];
          if (jobIds.length > 0) {
            // Check the latest job's status (handle both string and object formats)
            const latestEntry = jobIds[jobIds.length - 1];
            const latestJobId = typeof latestEntry === 'string' ? latestEntry : (latestEntry.job_id || latestEntry);
            try {
              const jobRes = await fetch(`${ONBOARDING_BASE}/api/onboarding_service/v1/jobs/${latestJobId}`);
              if (jobRes.ok) {
                const jobData = await jobRes.json();
                if (jobData.status && jobData.status !== 'COMPLETED' && jobData.status !== 'FAILED') {
                  activeJob = jobData;
                }
              }
            } catch (err) {
              console.warn('Job status check failed:', err.message);
            }
          }

          if (activeJob) {
            // A job is running — show Stage 1 in processing mode with progress
            setStage(1); setMaxStage(1);
            seeded.current[1] = true;
            setProc({ pct: activeJob.progress_percentage || 0, flav: activeJob.status, done: false, status: activeJob.status, error: null });

            // Connect to SSE stream for live updates
            const sseUrl = `${ONBOARDING_BASE}/api/onboarding_service/v1/jobs/${activeJob.job_id}/stream`;
            const eventSource = new EventSource(sseUrl);
            eventSource.addEventListener('status', (e) => {
              try {
                const d = JSON.parse(e.data);
                setProc((p) => p ? { pct: d.progress_percentage || p.pct, flav: d.message || d.status, done: false, status: d.status, error: null } : p);
                if (d.status === 'LOGIC_ENRICHMENT_STARTED' || d.status === 'TABLE_EXTRACTION_COMPLETED') {
                  setProcSheets((prev) => prev.map((s) => ({ ...s, status: s.status === 'failed' ? 'failed' : 'done' })));
                }
              } catch {}
            });
            eventSource.addEventListener('log', (e) => {
              try {
                const d = JSON.parse(e.data);
                setProc((p) => p ? { ...p, flav: d.message || p.flav } : p);
                const msg = d.message || '';
                if (msg.startsWith('Reading sheet:')) {
                  const sheetName = msg.replace('Reading sheet: ', '').split(' (')[0];
                  setProcSheets((prev) => {
                    const exists = prev.find((s) => s.name === sheetName);
                    if (exists) return prev.map((s) => s.name === sheetName ? { ...s, status: 'running' } : (s.status === 'running' ? { ...s, status: 'done' } : s));
                    return [...prev.map((s) => s.status === 'running' ? { ...s, status: 'done' } : s), { name: sheetName, status: 'running', tables: 0, info: msg }];
                  });
                } else if (msg.startsWith('Analyzing')) {
                  const match = msg.match(/(\d+) table regions? in (.+)/);
                  if (match) {
                    const [, count, sheetName] = match;
                    setProcSheets((prev) => prev.map((s) => s.name === sheetName ? { ...s, tables: parseInt(count) } : s));
                  }
                }
              } catch {}
            });
            eventSource.addEventListener('sheets_list', (e) => {
              try { const d = JSON.parse(e.data); if (d.sheets) setProcSheets(d.sheets.map((name) => ({ name, status: 'pending', tables: 0 }))); } catch {}
            });
            eventSource.addEventListener('sheet_done', (e) => {
              try { const d = JSON.parse(e.data); if (d.sheet) setProcSheets((prev) => prev.map((s) => s.name === d.sheet ? { ...s, status: 'done', tables: d.tables || s.tables } : s)); } catch {}
            });
            eventSource.addEventListener('progress', (e) => {
              try { const d = JSON.parse(e.data); if (d.progress_percentage) setProc((p) => p ? { ...p, pct: d.progress_percentage } : p); } catch {}
            });
            eventSource.addEventListener('enrichment_step', (e) => {
              try { const d = JSON.parse(e.data); setProc((p) => p ? { ...p, flav: d.message || p.flav } : p); if (d.step === 'complete') setProc((p) => p ? { ...p, pct: 90 } : p); } catch {}
            });
            eventSource.addEventListener('complete', (e) => {
              eventSource.close();
              try {
                const d = JSON.parse(e.data);
                if (d.status === 'FAILED') {
                  setProc((p) => p ? { ...p, pct: 0, done: true, status: 'FAILED', error: d.message } : p);
                } else {
                  setProc((p) => p ? { ...p, pct: 100, done: true } : p);
                  // Reload to pick up the completed extraction
                  setTimeout(() => window.location.reload(), 1500);
                }
              } catch {}
            });
            eventSource.onerror = () => {
              // Fallback: poll the job status
              eventSource.close();
              const poll = async () => {
                while (true) {
                  await new Promise((r) => setTimeout(r, 3000));
                  try {
                    const r = await fetch(`${ONBOARDING_BASE}/api/onboarding_service/v1/jobs/${activeJob.job_id}`);
                    if (!r.ok) break;
                    const s = await r.json();
                    setProc((p) => p ? { pct: s.progress_percentage, flav: s.status, done: false, status: s.status, error: s.error_message || null } : p);
                    if (s.status === 'COMPLETED' || s.status === 'FAILED') {
                      setProc((p) => p ? { ...p, done: true } : p);
                      if (s.status === 'COMPLETED') setTimeout(() => window.location.reload(), 1500);
                      break;
                    }
                  } catch { break; }
                }
              };
              poll();
            };
          } else {
            // No active job — Stage 1 editable
            setStage(1); setMaxStage(1);
            seeded.current[1] = true;
          }
        } else {
          // Brand new category with no files — Stage 1 from scratch
          setStage(1); setMaxStage(1);
          seeded.current[1] = true;
        }
      } catch (err) {
        console.warn('Resume category failed:', err.message);
        setStage(0);
      }
    })();
    return () => { alive = false; };
  }, []);

  const push = (...m) => setMessages((prev) => prev.concat(m));
  const agent = (blocks, opts = {}) => ({ id: nextMid(), kind: 'agent', blocks, reasoning: opts.reasoning, chips: opts.chips, done: false });
  const user = (text) => ({ id: nextMid(), kind: 'user', text });
  const mark = (label) => ({ id: nextMid(), kind: 'mark', text: label });
  const markDone = (id) => setMessages((m) => m.map((x) => (x.id === id ? { ...x, done: true } : x)));
  const clearChips = () => setMessages((m) => m.map((x) => (x.chips ? { ...x, chips: null } : x)));

  const scnDone = scenarios.filter((s) => s.q.trim() && s.a.trim()).length;
  const stage1Ready = !!((name || '').trim() && (owner || '').trim() && files.length && scnDone >= 1 && (calc.drivers || '').trim() && (calc.output || '').trim());
  const activeQuestions = liveQuestions || [];
  const outstanding = activeQuestions.filter((q) => !answers[q.id]);
  const filledScenarios = scenarios.filter((s) => s.q.trim() && s.a.trim());
  const valOk = !!valStates && valStates.every((s) => s.passed);
  const signLeft = (signoffs.semantic ? 0 : 1) + (signoffs.card ? 0 : 1);
  // Stage 2 ready: WS mode uses backend coverage, fallback uses local state
  // Allow continue if: backend says can_finish OR all priority questions are gone, AND sign-offs done
  const stage2Ready = signLeft === 0 && (
    (wsConnected && wsCoverage && wsCoverage.can_finish) ||
    (wsConnected && wsTiers && wsTiers.priority.length === 0) ||
    (!wsConnected && outstanding.length === 0)
  );
  const canAdvance = stage === 1 ? stage1Ready : stage === 2 ? stage2Ready : stage === 3 ? valOk : true;
  const dataReady = maxStage >= 2;

  useOE(() => {
    const c = scrollRef.current;
    if (!c || !pinRef.current) return;
    const el = c.querySelector('[data-mid="' + pinRef.current + '"]');
    if (!el) return;
    c.scrollTop = c.scrollTop + el.getBoundingClientRect().top - c.getBoundingClientRect().top - 6;
    pinRef.current = null;
  }, [messages]);

  function enterStage(n) {
    setStage(n);
    setMaxStage((m) => Math.max(m, n));
    if (n === 3 && !valStates) {
      setValStates(filledScenarios.map((_, i) => {
        const fails = valFails(i, filledScenarios.length);
        return { passed: !fails, origFailed: fails, comment: '', fixed: false, running: false, runs: 0, lastRunFixedNothing: false };
      }));
    }
    if (seeded.current[n]) return;
    seeded.current[n] = true;
    const m = mark(CAT_STAGES[n - 1].label);
    pinRef.current = m.id;
    if (n <= 2) push(m, agent(n === 1 ? STAGE1_BLOCKS : STAGE2_BLOCKS, { reasoning: null }));
    else if (n === 3) push(m, agent(STAGE3_BLOCKS, { reasoning: null }));
    else push(m, agent([{ type: 'p', text: 'Stage four is the sign-off: final model card, audit trail, and publishing the category to the live pricing engine. Not built yet.' }], { reasoning: null }));
  }

  // ---------- test case resolution ----------
  const patchVal = (i, patch) => setValStates((st) => st.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  const valChips = (i, num) => [
    { act: 'valresolve:' + i, label: 'Enough information — validate', icon: 'check' },
    { act: 'valstop:' + i, label: 'Stop trying to resolve the test case', icon: 'x' },
  ];

  function takeUpScenario(i, num) {
    setValEsc({ idx: i, num, notes: [] });
    clearChips();
    const sc = filledScenarios[i];
    const u = user(`Let's resolve test case ${num}.`);
    pinRef.current = u.id;
    push(u, agent([
      { type: 'p', text: `We are trying to resolve test case ${num}.` },
      { type: 'p', text: `You asked: ${sc.q} — and you expected: ${sc.a}` },
      { type: 'p', text: 'Walk me through how you would work that out. When you think we have covered it, tell me to validate and I will write the correction down for you.' },
    ], { reasoning: null, chips: valChips(i, num) }));
  }

  function exitScenarioResolution() {
    const v = valEsc;
    setValEsc(null);
    clearChips();
    if (!v) return;
    push(agent([{ type: 'p', text: `Leaving test case ${v.num} open. It stays in the workbench until it passes.` }], { reasoning: null }));
  }
  function scenarioReply(v, text) {
    clearChips();
    const sc = filledScenarios[v.idx];
    const l = text.toLowerCase();
    const asking = /\?$/.test(text.trim()) || /^(what|why|how|which|where|when|does|do|is|are|can|could|should)\b/.test(l);
    setValEsc((s) => (s ? { ...s, notes: s.notes.concat(asking ? [] : [text]) } : s));
    push(agent(asking
      ? [
        { type: 'p', text: `On that — I answered “${sc.q}” on the basis I judged most likely, and it did not match what you expected.` },
        { type: 'p', text: 'Keep going, or tell me to validate and I will write down what we have so far.' },
      ]
      : [
        { type: 'p', text: `Noted: “${text}”.` },
        { type: 'p', text: 'Anything else I should know about it, or is that enough to validate?' },
      ], { reasoning: null, chips: valChips(v.idx, v.num) }));
  }

  // ---------- files (upload to backend) ----------
  function addFiles(list) { setFiles((f) => f.concat(list)); }
  function onPick(e) {
    const picked = Array.from(e.target.files || []).filter((f) => /\.xlsx$/i.test(f.name));
    if (!picked.length) { e.target.value = ''; return; }

    // Only 1 file allowed for now
    if (files.length > 0) {
      setApiError('Currently only 1 file is supported per category. Multi-file support coming in Part 2.');
      e.target.value = '';
      return;
    }

    // Add to local state only — actual upload happens on task confirm
    const localEntries = [{ name: picked[0].name, size: +(picked[0].size / 1048576).toFixed(2), kind: 'excel', file: picked[0] }];
    addFiles(localEntries);
    e.target.value = '';
  }

  // ---------- questions ----------
  function recordAnswer(q, text) {
    setAnswers((a) => ({ ...a, [q.id]: text }));
    // answering in the workbench closes any standing clarification for that question
    if (esc && esc.id === q.id) { setEsc(null); clearChips(); }
  }

  function explainQuestion(q) {
    // If WS connected, send through the real agent
    if (wsConnected && wsRef.current && wsRef.current.readyState === 1) {
      wsSendMessage(`Help me understand: ${q.question}`);
      return;
    }
    // Otherwise show that the agent is unavailable
    const u = user(`Help me understand: ${q.question}`);
    pinRef.current = u.id;
    push(u, agent([{ type: 'p', text: 'The interview agent is not connected. It should reconnect shortly — try again in a moment.' }], { reasoning: null }));
  }


  function onChip(c) {
    clearChips();
    if (c.act.startsWith('valresolve:')) {
      const i = +c.act.slice(11);
      const v = valEsc;
      const notes = v && v.notes.length ? v.notes.join(' ') : '';
      patchVal(i, { comment: notes, fixed: true, lastRunFixedNothing: false });
      setValEsc(null);
      const u = user(c.label);
      pinRef.current = u.id;
      push(u, agent([{ type: 'p', text: 'Written down. Re-run the test case in the workbench.' }], { reasoning: null }));
      return;
    }
    if (c.act.startsWith('valstop:')) {
      setValEsc(null);
      const u = user(c.label);
      pinRef.current = u.id;
      push(u, agent([{ type: 'p', text: 'Stopped. The test case stays open in the workbench.' }], { reasoning: null }));
      return;
    }
  }

  // ---------- chat ----------
  function send() {
    const t = input.trim();
    if (!t) return;
    setInput('');

    // Stage 2 with WebSocket connected — send through the real interview agent
    if (stage === 2 && wsConnected && wsRef.current && wsRef.current.readyState === 1) {
      wsSendMessage(t);
      return;
    }

    const u = user(t);
    pinRef.current = u.id;
    push(u);

    // Stage 3 validation resolution flows (these are local UI workflows, not fake AI)
    if (valEsc) { setTimeout(() => scenarioReply(valEsc, t), 40); return; }

    // Stage 2 but WS not connected — can't reach the agent
    if (stage === 2) {
      push(agent([{ type: 'p', text: 'The interview agent is not connected right now. It should reconnect shortly — try again in a moment.' }], { reasoning: null }));
      return;
    }

    // Stage 1 — no agent interaction available yet
    if (stage === 1) {
      push(agent([{ type: 'p', text: 'Complete the tasks in the workbench to continue. The agent becomes available after your workbook is processed.' }], { reasoning: null }));
      return;
    }

    // Stage 3+ placeholder
    push(agent([{ type: 'p', text: 'This stage is still being built — I will be able to act on that once it ships.' }], { reasoning: null }));
  }

  // ---------- processing moment (real swarm API) ----------
  function beginProcessing() {
    const m = { id: nextMid(), kind: 'proc' };
    pinRef.current = m.id;
    push(m);
    setProc({ pct: 8, flav: PROCESS_FLAVOURS[0], done: false, status: 'QUEUED', error: null });
    setProcSheets([]);
    setApiError(null);

    // Call real swarm API
    (async () => {
      try {
        // Build user_context from calc fields
        const userContext = {
          category_description: `${name.trim()} pricing category`,
          pricing_model_type: (calc.formulas || '').trim() || undefined,
          known_dependencies: (calc.drivers || '').trim() ? [(calc.drivers || '').trim()] : [],
        };

        const targetFileId = fileId || (files.length > 0 && files[0].file_id);
        if (!targetFileId) {
          setApiError('No uploaded file found. Please upload a file first.');
          setProc((p) => p ? { ...p, pct: 0, done: true, status: 'FAILED', error: 'No file uploaded' } : p);
          return;
        }
        if (!categoryId) {
          setApiError('No category created. Please complete Task 1 first.');
          setProc((p) => p ? { ...p, pct: 0, done: true, status: 'FAILED', error: 'No category created' } : p);
          return;
        }

        const result = await runSwarm({ fileId: targetFileId, categoryId, userContext });

        // Stream progress via SSE (falls back to polling if SSE unavailable)
        const ONBOARDING_BASE = import.meta.env.VITE_ONBOARDING_API_URL || '';
        const sseUrl = `${ONBOARDING_BASE}/api/onboarding_service/v1/jobs/${result.job_id}/stream`;

        await new Promise((resolve, reject) => {
          let resolved = false;

          // Use fetch + ReadableStream for SSE (more reliable than EventSource for CORS)
          const ONBOARDING_BASE_SSE = import.meta.env.VITE_ONBOARDING_API_URL || '';
          const controller = new AbortController();

          fetch(sseUrl, { signal: controller.signal }).then(async (response) => {
            if (!response.ok || !response.body) {
              throw new Error(`SSE connection failed: ${response.status}`);
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
              const { done, value } = await reader.read();
              if (done || resolved) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              let currentEvent = '';
              let currentData = '';

              for (const line of lines) {
                if (line.startsWith('event: ')) { currentEvent = line.slice(7).trim(); }
                else if (line.startsWith('data: ')) { currentData = line.slice(6); }
                else if (line === '' && currentEvent && currentData) {
                  // Process the event
                  try {
                    const d = JSON.parse(currentData);
                    switch (currentEvent) {
                      case 'status':
                        setProc((p) => p ? { pct: d.progress_percentage || p.pct, flav: d.message || d.status, done: false, status: d.status, error: null } : p);
                        if (d.status === 'LOGIC_ENRICHMENT_STARTED' || d.status === 'TABLE_EXTRACTION_COMPLETED') {
                          setProcSheets((prev) => prev.map((s) => ({ ...s, status: s.status === 'failed' ? 'failed' : 'done' })));
                        }
                        break;
                      case 'log':
                        setProc((p) => p ? { ...p, flav: d.message || p.flav } : p);
                        const msg = d.message || '';
                        if (msg.startsWith('Reading sheet:')) {
                          const sheetName = msg.replace('Reading sheet: ', '').split(' (')[0];
                          setProcSheets((prev) => {
                            const exists = prev.find((s) => s.name === sheetName);
                            if (exists) return prev.map((s) => s.name === sheetName ? { ...s, status: 'running' } : (s.status === 'running' ? { ...s, status: 'done' } : s));
                            return [...prev.map((s) => s.status === 'running' ? { ...s, status: 'done' } : s), { name: sheetName, status: 'running', tables: 0 }];
                          });
                        } else if (msg.startsWith('Analyzing')) {
                          const match = msg.match(/(\d+) table regions? in (.+)/);
                          if (match) setProcSheets((prev) => prev.map((s) => s.name === match[2] ? { ...s, tables: parseInt(match[1]) } : s));
                        }
                        break;
                      case 'sheets_list':
                        if (d.sheets) setProcSheets(d.sheets.map((name) => ({ name, status: 'pending', tables: 0 })));
                        break;
                      case 'sheet_done':
                        if (d.sheet) setProcSheets((prev) => prev.map((s) => s.name === d.sheet ? { ...s, status: 'done', tables: d.tables || s.tables } : s));
                        break;
                      case 'progress':
                        if (d.progress_percentage) setProc((p) => p ? { ...p, pct: d.progress_percentage } : p);
                        break;
                      case 'enrichment_step':
                        setProc((p) => p ? { ...p, flav: d.message || p.flav } : p);
                        if (d.step === 'complete') setProc((p) => p ? { ...p, pct: 90 } : p);
                        break;
                      case 'complete':
                        if (d.status === 'FAILED') {
                          setProc((p) => p ? { ...p, pct: 0, done: true, status: 'FAILED', error: d.message } : p);
                          reject(new Error(d.message || 'Processing failed'));
                        } else {
                          resolved = true;
                          resolve();
                        }
                        controller.abort();
                        return;
                    }
                  } catch {}
                  currentEvent = '';
                  currentData = '';
                }
              }
            }
          }).catch((err) => {
            if (resolved || err.name === 'AbortError') return;
            // Fallback to polling
            pollJobUntilDone(result.job_id, null, {
              interval: 3000,
              onProgress: (status) => {
                setProc((p) => p ? { pct: status.progress_percentage, flav: status.status, done: false, status: status.status, error: status.error_message || null } : p);
              },
            }).then(resolve).catch(reject);
          });
        });

        // Completed
        setProc((p) => p ? { ...p, pct: 100, done: true } : p);

        // Fetch extraction + enrichment data for Data Semantic and Questions
        try {
          const ONBOARDING_BASE = import.meta.env.VITE_ONBOARDING_API_URL || '';
          const [extRes, enrRes] = await Promise.all([
            fetch(`${ONBOARDING_BASE}/api/onboarding_service/v1/model-cards/${categoryId}/extraction`).then(r => r.ok ? r.json() : null),
            fetch(`${ONBOARDING_BASE}/api/onboarding_service/v1/model-cards/${categoryId}/enrichment`).then(r => r.ok ? r.json() : null),
          ]);

          if (extRes && extRes.tables) {
            setLiveExtraction(extRes.tables);
          }

          if (enrRes && enrRes.enrichment) {
            setLiveEnrichment(enrRes.enrichment);

            // Build interview questions from enrichment
            const iq = enrRes.enrichment.interview_questions || {};
            const allQs = [];
            (iq.high_level || []).forEach((q, i) => {
              allQs.push({
                id: `hl_${i}`,
                type: 'open',
                question: typeof q === 'string' ? q : q.question,
                recommend: '',
                why: typeof q === 'string' ? '' : (q.rationale || ''),
                hint: 'Answer in your own words.',
              });
            });
            (iq.low_level || []).forEach((q, i) => {
              allQs.push({
                id: `ll_${i}`,
                type: 'open',
                question: typeof q === 'string' ? q : q.question,
                recommend: '',
                why: typeof q === 'string' ? '' : (q.rationale || ''),
                hint: typeof q === 'string' ? '' : (q.target_sheet ? `Relates to: ${q.target_sheet}` : ''),
              });
            });
            if (allQs.length > 0) setLiveQuestions(allQs);
          }
        } catch (err) {
          console.warn('Fetch extraction/enrichment failed (non-critical):', err.message);
        }

        enterStage(2);

        // Start interview session in the background (for data persistence)
        try {
          const config = await getInterviewConfig();
          setInterviewAgentUrl(config.interview_agent_url || INTERVIEW_AGENT_BASE);
          const sessRes = await fetch(`${INTERVIEW_AGENT_BASE}/api/interview_agent/v1/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Actor': owner.trim() || 'category_manager' },
            body: JSON.stringify({ category_id: categoryId }),
          });
          if (sessRes.ok) {
            const sessData = await sessRes.json();
            setInterviewSessionId(sessData.session?.session_id || null);
          }
        } catch (err) {
          // Interview session start is non-blocking — Stage 2 can still work with local state
          console.warn('Interview session start failed (non-critical):', err.message);
        }
      } catch (err) {
        setApiError(`Swarm processing failed: ${err.message}`);
        setProc((p) => p ? { ...p, pct: 0, done: true, status: 'FAILED', error: err.message } : p);
      }
    })();
  }

  function onContinue() {
    if (!canAdvance) return;
    if (stage === 1) {
      // If already processed before (reviewing), just re-save and advance — don't re-run swarm
      if (maxStage >= 2 && categoryId) {
        (async () => {
          try {
            const filled = scenarios.filter((s) => s.q.trim() && s.a.trim());
            if (filled.length > 0) {
              await saveTestCases({ categoryId, testCases: filled.map((s) => ({ question: s.q.trim(), answer: s.a.trim() })) });
            }
            if ((calc.drivers || '').trim() && (calc.output || '').trim()) {
              await saveCalculations({ categoryId, calculations: [{ inputs_and_drivers: (calc.drivers || '').trim(), output_location: (calc.output || '').trim(), formulas: (calc.formulas || '').trim() }] });
            }
          } catch (err) {
            console.warn('Re-save on continue failed:', err.message);
          }
        })();
        setStage(2);
        return;
      }
      beginProcessing();
      return;
    }

    // Stage 2 → 3: Save confirmed answers to model card via PATCH
    if (stage === 2 && categoryId) {
      (async () => {
        try {
          const ONBOARDING_BASE = import.meta.env.VITE_ONBOARDING_API_URL || '';
          const confirmedAnswers = {};
          activeQuestions.forEach((q) => { if (answers[q.id]) confirmedAnswers[q.id] = answers[q.id]; });
          await fetch(`${ONBOARDING_BASE}/api/onboarding_service/v1/model-cards/${categoryId}?user_id=${encodeURIComponent(owner.trim())}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields: { confirmed_answers: confirmedAnswers, stage2_completed: true } }),
          });
        } catch (err) {
          console.warn('Save Stage 2 answers failed (non-critical):', err.message);
        }
      })();
    }

    // Stage 3 → 4: Finish interview session if we have one
    if (stage === 3 && interviewSessionId) {
      (async () => {
        try {
          await fetch(`${INTERVIEW_AGENT_BASE}/api/interview_agent/v1/sessions/${interviewSessionId}/finish`, {
            method: 'POST',
            headers: { 'X-Actor': owner.trim() || 'category_manager' },
          });
        } catch (err) {
          console.warn('Interview session finish failed (non-critical):', err.message);
        }
      })();
    }

    enterStage(stage + 1);
  }

  const processing = !!(proc && !proc.done);

  const topBar = (
    <div className="ob-top">
      <div className="ob-ident">
        <span className="k">Onboarding</span>
        <span className="n">{name.trim() || 'New category'}</span>
      </div>
      <div className="ob-track">
        {CAT_STAGES.map((s, i) => {
          const reachable = maxStage >= s.n || (s.n === stage + 1 && canAdvance && !processing);
          return (
            <React.Fragment key={s.n}>
              {i > 0 && <span className={'sep' + (maxStage > i ? ' done' : '')} />}
              <button className={'ob-step' + (stage === s.n ? ' active' : maxStage >= s.n ? ' done' : '')}
                disabled={!reachable} onClick={() => reachable && (s.n <= maxStage ? setStage(s.n) : onContinue())}>
                <span className="n">{stage > s.n || maxStage > s.n ? <Icon name="check" size={12} /> : s.n}</span>
                <span className="l">{s.label}</span>
              </button>
            </React.Fragment>
          );
        })}
      </div>
      <button className="gbtn" onClick={onExit}><Icon name="x" size={15} /> Exit</button>
    </div>
  );

  if (stage === -1) {
    return (
      <div className={'ob-shell' + (nomo ? ' no-motion' : '')}>
        {topBar}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--label-tertiary)', fontSize: 14 }}>
          Loading category data…
        </div>
      </div>
    );
  }

  if (stage === 0) {
    return (
      <div className={'ob-shell' + (nomo ? ' no-motion' : '')}>
        {topBar}
        <OnboardWelcome motion={motion} onStart={() => enterStage(1)} onExit={onExit} />
      </div>
    );
  }

  return (
    <div className={'ob-shell' + (nomo ? ' no-motion' : '')}>
      {topBar}
      {apiError && (
        <div className="onb-error-banner" style={{ margin: '0 24px' }}>
          <span>{apiError}</span>
          <button onClick={() => setApiError(null)}>✕</button>
        </div>
      )}
      <div className="ob-body">
        {/* agent panel — only shown from Stage 2 onward */}
        {stage >= 2 ? (
        <div className="ob-agent">
          <div className="ob-agent-scroll" ref={scrollRef}>
            <div className="ob-agent-inner">
              {messages.map((m) => {
                if (m.kind === 'mark') return <div key={m.id} data-mid={m.id} className="ob-stagemark">{m.text}</div>;
                if (m.kind === 'user') return <div key={m.id} data-mid={m.id}><UserMessage text={m.text} /></div>;
                if (m.kind === 'proc') return <div key={m.id} data-mid={m.id}><ProcessingCard pct={proc ? proc.pct : 100} flavour={proc ? proc.flav : ''} done={!proc || proc.done} status={proc ? proc.status : null} error={proc ? proc.error : null} /></div>;
                return (
                  <div key={m.id} data-mid={m.id}>
                    <AgentMessage blocks={m.blocks} reasoning={m.reasoning} motion={motion} animate={!m.done && !nomo}
                      chips={m.chips} onChip={onChip} onDone={() => markDone(m.id)} />
                  </div>
                );
              })}
            </div>
          </div>
          <div className="ob-agent-dock">
            <DynamicIsland
              value={input} onChange={setInput} onSend={send}
              tool="chat" onToolChange={() => { }} template={null} onTemplate={() => { }} noTemplatePop
              hideToolSelector
              variant={islandVariant} staticLabel="Onboarding agent" staticIcon="sparkles"
              placeholder={valEsc ? `Tell me the rule I should follow for test case ${valEsc.num}…` : 'Ask a question, or tell me to change something…'}
            />
          </div>
        </div>
        ) : (
        <div className="ob-agent" style={{ justifyContent: 'center', padding: '40px 28px' }}>
          <div style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ width: 36, height: 36, borderRadius: 11, display: 'grid', placeItems: 'center', color: '#fff', background: 'var(--pmi-grad-full)' }}><Icon name="sparkles" size={18} /></span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Onboarding agent</div>
                <div style={{ fontSize: 12, color: 'var(--label-tertiary)' }}>Available after your workbook is processed</div>
              </div>
            </div>
            {STAGE1_BLOCKS.map((b, i) => (
              <p key={i} style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--label-secondary)', margin: '0 0 12px' }}>{b.text}</p>
            ))}
          </div>
        </div>
        )}

        {/* one work card: Workbench selector left, artifact selector top-right */}
        <div className="ob-col">
          <div className="ob-tabs">
            <div className="ob-artseg ob-workseg">
              <button className={pane === 'work' ? 'active' : ''} onClick={() => setPane('work')}>
                <Icon name="tool" size={15} /> Workbench
              </button>
            </div>
            <div className="ob-artifacts">
              <span className="who">Agent Output Preview</span>
              <div className="ob-artseg">
                <button className={pane === 'card' ? 'active' : ''} onClick={() => setPane('card')} disabled={!dataReady}>
                  <Icon name="cube" size={15} /> Model Card
                </button>
                <button className={pane === 'semantic' ? 'active' : ''} onClick={() => setPane('semantic')} disabled={!dataReady}>
                  <Icon name="database" size={15} /> Data Semantic
                </button>
              </div>
            </div>
          </div>
          <div className="ob-pane">
            {pane === 'work' && (
              <React.Fragment>
                <div className="ob-panecap"><Icon name="tool" size={13} /> Your tasks · {CAT_STAGES[stage - 1].label}</div>
                {processing ? (
                  <div style={{ padding: '24px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <Icon name="refresh" size={16} className="spin" style={{ color: 'var(--pmi-blue)' }} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--label-primary)' }}>Processing your workbook</span>
                    </div>

                    {/* Progress bar */}
                    <div className="pc-bar" style={{ marginBottom: 12 }}><span style={{ width: (proc ? proc.pct : 0) + '%' }} /></div>

                    {/* Stage label */}
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--label-secondary)', marginBottom: 14 }}>
                      {proc && proc.status === 'TABLE_EXTRACTION_STARTED' ? 'Stage 1 of 2: Table Extraction'
                        : proc && proc.status === 'LOGIC_ENRICHMENT_STARTED' ? 'Stage 2 of 2: Logic Enrichment'
                          : proc && proc.status === 'TABLE_EXTRACTION_COMPLETED' ? 'Stage 1 complete — starting enrichment'
                            : `Progress: ${proc ? proc.pct : 0}%`}
                    </div>

                    {/* Sheet breakdown */}
                    {procSheets.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--label-tertiary)', marginBottom: 8 }}>
                          Sheets ({procSheets.filter((s) => s.status === 'done').length} of {procSheets.length} complete)
                        </div>
                        {procSheets.map((sheet) => (
                          <div key={sheet.name} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 0', borderTop: '0.5px solid var(--separator)' }}>
                            <span style={{ width: 18, height: 18, borderRadius: 6, display: 'grid', placeItems: 'center', fontSize: 10, flexShrink: 0,
                              background: sheet.status === 'done' ? 'rgba(52,199,89,0.15)' : sheet.status === 'running' ? 'rgba(255,204,0,0.18)' : sheet.status === 'failed' ? 'rgba(255,69,58,0.15)' : 'var(--fill-tertiary)',
                              color: sheet.status === 'done' ? 'var(--c-green)' : sheet.status === 'running' ? '#e6a800' : sheet.status === 'failed' ? 'var(--c-red)' : 'var(--label-tertiary)' }}>
                              {sheet.status === 'done' ? <Icon name="check" size={10} /> : sheet.status === 'running' ? <Icon name="refresh" size={10} className="spin" /> : sheet.status === 'failed' ? <Icon name="x" size={10} /> : '·'}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: sheet.status === 'running' ? 600 : 400, color: sheet.status === 'running' ? 'var(--label)' : 'var(--label-secondary)', flex: 1 }}>
                              {sheet.name}
                            </span>
                            {sheet.tables > 0 && <span style={{ fontSize: 11, color: 'var(--label-tertiary)', fontFamily: 'var(--font-mono)' }}>{sheet.tables} tables</span>}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Current activity */}
                    {proc && proc.flav && proc.flav !== proc.status && (
                      <div style={{ fontSize: 12, color: 'var(--label-tertiary)', lineHeight: 1.5, padding: '8px 12px', borderRadius: 10, background: 'var(--fill-quaternary)' }}>
                        {proc.flav}
                      </div>
                    )}

                    {/* Fallback when no sheets detected yet */}
                    {procSheets.length === 0 && (
                      <div style={{ fontSize: 12, color: 'var(--label-tertiary)', lineHeight: 1.5 }}>
                        {proc && (proc.status === 'LOGIC_ENRICHMENT_STARTED' || proc.status === 'LOGIC_ENRICHMENT_COMPLETED')
                          ? 'Analyzing table relationships, business rules, and generating interview questions…'
                          : 'Preparing your workbook for analysis…'}
                      </div>
                    )}

                    {/* Enrichment phase indicator (after extraction) */}
                    {proc && proc.status === 'LOGIC_ENRICHMENT_STARTED' && procSheets.length > 0 && (
                      <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 12, background: 'var(--fill-quaternary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <Icon name="refresh" size={13} className="spin" style={{ color: 'var(--pmi-blue)' }} />
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--label)' }}>Logic Enrichment</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--label-secondary)', lineHeight: 1.5 }}>
                          Analyzing how tables relate, identifying business rules, and generating interview questions. Usually 1-3 minutes.
                        </div>
                      </div>
                    )}
                  </div>
                )
                  : stage === 1 ? (
                    <UploadWorkbench
                      readOnly={maxStage >= 2}
                      name={name} setName={setName} owner={owner} setOwner={setOwner}
                      commercialClassification={commercialClassification} setCommercialClassification={setCommercialClassification}
                      businessContext={businessContext} setBusinessContext={setBusinessContext}
                      files={files} setFiles={setFiles} onPick={onPick} onRemove={(i) => setFiles((f) => f.filter((_, j) => j !== i))}
                      scenarios={scenarios}
                      setScenario={(i, k, v) => setScenarios((s) => s.map((x, j) => (j === i ? { ...x, [k]: v } : x)))}
                      addScenario={() => setScenarios((s) => s.concat({ q: '', a: '' }))}
                      removeScenario={(i) => setScenarios((s) => s.filter((_, j) => j !== i))}
                      calc={calc} setCalc={(k, v) => setCalcState((c) => ({ ...c, [k]: v }))}
                      open={block} setOpen={setBlock}
                      loadingStep={loadingStep}
                      stepErrors={stepErrors}
                      next={async (n) => {
                        setStepErrors((prev) => { const c = { ...prev }; delete c[n]; return c; });
                        setLoadingStep(n);
                        try {
                          // Task 1 confirmed: create category
                          if (n === 1 && !categoryId && name.trim()) {
                            const result = await createCategory({ categoryName: name.trim(), categoryOwner: owner.trim(), commercialClassification, businessContext });
                            setCategoryId(result.category_id);
                            window.history.replaceState(null, '', `/category-management/${result.category_id}`);
                          }
                          // Task 2 confirmed: upload files to backend
                          if (n === 2 && categoryId) {
                            const pending = files.filter((f) => f.file && !f.file_id);
                            for (const entry of pending) {
                              try {
                                const result = await uploadFile({
                                  file: entry.file,
                                  categoryId,
                                  filePurpose: entry.purpose || '',
                                  refreshFrequency: entry.refreshFrequency || '',
                                  sourceType: entry.sourceType || '',
                                  fileOwner: entry.fileOwner || '',
                                });
                                if (!fileId) setFileId(result.file_id);
                                setFiles((prev) => prev.map((f) => f.name === entry.name ? { ...f, file: null, file_id: result.file_id } : f));
                              } catch (err) {
                                setApiError(`Upload failed for ${entry.name}: ${err.message}`);
                                setFiles((prev) => prev.map((f) => f.name === entry.name ? { ...f, error: true } : f));
                              }
                            }
                          }
                          // Task 3 confirmed: save test cases
                          if (n === 3 && categoryId) {
                            const filled = scenarios.filter((s) => s.q.trim() && s.a.trim());
                            if (filled.length > 0) {
                              await saveTestCases({ categoryId, testCases: filled.map((s) => ({ question: s.q.trim(), answer: s.a.trim() })) });
                            }
                          }
                          // Task 4 confirmed: save calculations
                          if (n === 4 && categoryId) {
                            await saveCalculations({ categoryId, calculations: [{ inputs_and_drivers: (calc.drivers || '').trim(), output_location: (calc.output || '').trim(), formulas: (calc.formulas || '').trim() }] });
                          }
                          setLoadingStep(null);
                        } catch (err) {
                          setLoadingStep(null);
                          setStepErrors((prev) => ({ ...prev, [n]: err.message || 'Something went wrong' }));
                          return; // Don't advance on error
                        }
                        setBlock([1, 2, 3, 4].find((x) => x > n) || 0);
                      }}
                    />
                  ) : stage === 2 ? (
                    (wsConnected || liveQuestions) ? (
                      <ConfirmWorkbench answers={answers} escalatedId={esc && esc.id} signoffs={signoffs}
                        questions={liveQuestions} readOnly={maxStage >= 3}
                        wsQuestions={wsQuestions} wsAnswered={wsAnswered} wsConnected={wsConnected}
                        wsProcessing={wsProcessing} wsSendMessage={wsSendMessage} wsSendEdit={wsSendEdit} wsCoverage={wsCoverage}
                        wsTiers={wsTiers}
                        onAnswer={recordAnswer}
                        onReopen={(q) => setAnswers((a) => { const n = { ...a }; delete n[q.id]; return n; })}
                        onEscalate={explainQuestion} onExitEscalation={() => {}} onSignoff={(k, v) => setSignoffs((s) => ({ ...s, [k]: v }))}
                        onGoTab={setPane} />
                    ) : <WorkbenchSkeleton />
                  ) : stage === 3 ? (
                    <StagePlaceholderPane stage={stage} />
                  ) : <StagePlaceholderPane stage={stage} />}
              </React.Fragment>
            )}

            {pane === 'card' && (dataReady
              ? <ModelCardPane card={{ name, owner, version: 'v1', updated: 'just now' }} answers={answers} calc={calc} changes={changes} questions={liveQuestions || []} enrichment={liveEnrichment} extraction={liveExtraction} />
              : <PaneEmpty icon="cube" title="The model card builds itself" body="As I read your files and you confirm the ambiguous bits, the category model card assembles here — the data semantic and the business rules I'll apply." pre="Needs a processed file" />)}

            {pane === 'semantic' && (dataReady
              ? <DataSemanticPane files={files} liveExtraction={liveExtraction} liveEnrichment={liveEnrichment} />
              : <PaneEmpty icon="database" title="Nothing to read yet" body="Once your files finish processing, this is where the extracted table schemas, column types, and formula lineage appear." pre="Needs a processed file" />)}
          </div>
          <div className="ob-pane-foot">
            {stage > 1 && stage >= maxStage && !processing && <button className="gbtn" onClick={() => { const prev = stage - 1; setStage(prev); setPane('work'); }}><Icon name="chevronLeft" size={15} /> Back</button>}
            {stage < maxStage && <button className="gbtn" onClick={() => { setStage(maxStage); setPane('work'); }}><Icon name="arrowRight" size={15} /> Return to current stage</button>}
            <span className="ob-foot-note">
              {processing && <React.Fragment><Icon name="refresh" size={14} className="spin" /> {proc.flav}</React.Fragment>}
              {!processing && stage === 1 && (maxStage >= 2
                ? <React.Fragment><Icon name="check" size={14} style={{ color: 'var(--c-green)' }} /> Stage complete (read-only)</React.Fragment>
                : stage1Ready
                  ? <React.Fragment><Icon name="check" size={14} style={{ color: 'var(--c-green)' }} /> All tasks done</React.Fragment>
                  : 'Tasks collapse as you finish them')}
              {!processing && stage === 2 && (maxStage >= 3
                ? <React.Fragment><Icon name="check" size={14} style={{ color: 'var(--c-green)' }} /> Stage complete (read-only)</React.Fragment>
                : stage2Ready
                  ? <React.Fragment><Icon name="check" size={14} style={{ color: 'var(--c-green)' }} /> Answered and signed off</React.Fragment>
                  : wsConnected && wsTiers
                    ? `${wsTiers.priority.length} question${wsTiers.priority.length === 1 ? '' : 's'} · ${signLeft} sign-off${signLeft === 1 ? '' : 's'} left`
                    : `${outstanding.length} question${outstanding.length === 1 ? '' : 's'} · ${signLeft} sign-off${signLeft === 1 ? '' : 's'} left`)}
              {!processing && stage === 3 && (valOk
                ? <React.Fragment><Icon name="check" size={14} style={{ color: 'var(--c-green)' }} /> Every test case passing</React.Fragment>
                : valStates
                  ? `${valStates.filter((s) => !s.passed).length} test case${valStates.filter((s) => !s.passed).length === 1 ? '' : 's'} still failing — correct and re-run`
                  : 'Running your test cases…')}
              {!processing && stage >= 4 && 'Placeholder stage'}
            </span>
            <span style={{ flex: 1 }} />
            {!processing && stage >= maxStage && (stage < 4
              ? <button className="gbtn primary" disabled={!canAdvance} style={{ opacity: canAdvance ? 1 : 0.4 }} onClick={onContinue}>Continue <Icon name="arrowRight" size={15} /></button>
              : <button className="gbtn primary" onClick={onExit}>Back to directory <Icon name="arrowRight" size={15} /></button>)}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CategoryOnboard, AgentMessage, ProcessingCard, OnboardWelcome, AnswerBodyStream });
// category.jsx — Category Management page: directory + onboarding entry
const { useState: useCatS } = React;

function CategoryDirectory({ onStartOnboard, onOpenCategory }) {
  const [q, setQ] = useCatS('');
  const [mineOnly, setMineOnly] = useCatS(false);
  const [liveCards, setLiveCards] = useCatS(null);
  const [loadErr, setLoadErr] = useCatS(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useCatS(null); // { category_id, name }
  const [deleteMode, setDeleteMode] = useCatS('preview'); // 'preview' | 'confirm'
  const [dryRunResult, setDryRunResult] = useCatS(null);
  const [deleteLoading, setDeleteLoading] = useCatS(false);
  const [deleteResult, setDeleteResult] = useCatS(null);

  async function handleDeleteClick(e, card) {
    e.stopPropagation();
    setDeleteTarget(card);
    setDeleteMode('preview');
    setDryRunResult(null);
    setDeleteResult(null);
    setDeleteLoading(true);
    // Auto-run dry run
    try {
      const ONBOARDING_BASE = import.meta.env.VITE_ONBOARDING_API_URL || '';
      const res = await fetch(`${ONBOARDING_BASE}/api/onboarding_service/v1/categories/${card.category_id}?dry_run=true`, { method: 'DELETE' });
      if (res.ok) setDryRunResult(await res.json());
      else setDryRunResult({ error: `Failed: ${res.status}` });
    } catch (err) { setDryRunResult({ error: err.message }); }
    setDeleteLoading(false);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const ONBOARDING_BASE = import.meta.env.VITE_ONBOARDING_API_URL || '';
      const res = await fetch(`${ONBOARDING_BASE}/api/onboarding_service/v1/categories/${deleteTarget.category_id}?confirm=true`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteResult(await res.json());
        // Remove from local list
        setLiveCards((prev) => prev ? prev.filter((c) => c.category_id !== deleteTarget.category_id) : prev);
      } else {
        setDeleteResult({ error: `Delete failed: ${res.status}` });
      }
    } catch (err) { setDeleteResult({ error: err.message }); }
    setDeleteLoading(false);
  }

  // Fetch categories from onboarding API on mount
  React.useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const ONBOARDING_BASE = import.meta.env.VITE_ONBOARDING_API_URL || '';
        const res = await fetch(`${ONBOARDING_BASE}/api/onboarding_service/v1/categories/`);
        if (!res.ok) throw new Error(`${res.status}`);
        const data = await res.json();
        if (!alive) return;
        // Map backend response to card shape
        const mapped = data.map((c) => ({
          name: c.category_name,
          owner: c.category_owner || 'Unknown',
          role: '',
          updated: c.created_at ? c.created_at.split('T')[0] : '—',
          version: c.version ? `v${c.version}` : 'v0',
          tags: c.tags || [],
          tables: c.total_tables || 0,
          access: true,
          logic: c.description || 'No description yet.',
          category_id: c.category_id,
        }));
        setLiveCards(mapped);
      } catch (err) {
        if (!alive) return;
        setLoadErr(err.message);
        // Fallback to static data
        setLiveCards(null);
      }
    }
    load();
    return () => { alive = false; };
  }, []);

  const cards = liveCards || [];
  const isLoading = !liveCards && !loadErr;
  const isEmpty = liveCards && liveCards.length === 0;
  const list = cards.filter((c) => {
    if (mineOnly && !c.access) return false;
    const s = q.trim().toLowerCase();
    return !s || c.name.toLowerCase().includes(s) || c.owner.toLowerCase().includes(s) || (c.tags || []).some((t) => t.toLowerCase().includes(s));
  });
  return (
    <div className="page">
      <div className="page-inner">
        <div className="page-head">
          <div className="page-kicker">Platform</div>
          <h1 className="page-title">Category Management</h1>
          <p className="page-sub">Every registered pricing category and the model card behind it — the deterministic logic the assistant uses when it quotes a number.</p>
        </div>

        <div className="cat-toolbar">
          <span className="cat-search">
            <Icon name="search" size={16} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search categories, owners, tags" />
          </span>
          <div className="seg">
            <button className={mineOnly ? '' : 'active'} onClick={() => setMineOnly(false)}>All categories</button>
            <button className={mineOnly ? 'active' : ''} onClick={() => setMineOnly(true)}>My categories</button>
          </div>
          <span style={{ flex: 1 }} />
        </div>

        <div className="cat-grid">
          <button className="cat-create" onClick={onStartOnboard} aria-label="Onboard a new category">
            <Icon name="plus" size={34} className="plus" />
            <span className="cl">Onboard a new category</span>
          </button>
          {isLoading && (
            <div className="cat-card" style={{ opacity: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--label-tertiary)' }}>Loading categories…</span>
            </div>
          )}
          {loadErr && (
            <div className="empty-tab">
              <div className="et-ic"><Icon name="x" size={26} /></div>
              Could not load categories from the backend. Check that the onboarding service is running.
              <div style={{ fontSize: 11, color: 'var(--label-tertiary)', marginTop: 6 }}>{loadErr}</div>
            </div>
          )}
          {isEmpty && !q.trim() && (
            <div className="empty-tab">
              <div className="et-ic"><Icon name="layers" size={26} /></div>
              No categories have been onboarded yet. Click "Onboard a new category" to get started.
            </div>
          )}
          {list.map((c) => (
            <div key={c.name} className="cat-card" onClick={() => onOpenCategory && onOpenCategory(c)} style={{ cursor: 'pointer' }}>
              <div className="cc-top">
                <span className="cc-mark"><Icon name="cube" size={20} /></span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="cc-name">{c.name}</div>
                  <div className="cc-owner">{c.owner} · {c.role}</div>
                </div>
                <button className="cc-delete" onClick={(e) => handleDeleteClick(e, c)} title="Delete category">
                  <Icon name="trash" size={14} />
                </button>
                <span className="cc-ver">{c.version}</span>
              </div>
              <p className="cc-logic">{c.logic}</p>
              <div className="cc-tags">{c.tags.map((t) => <span key={t} className="tagchip">{t}</span>)}</div>
              <div className="cc-foot">
                <span><b>{c.tables}</b> tables</span>
                <span>{c.updated}</span>
                {!c.access && <span className="cc-locked"><Icon name="shield" size={13} /> View only</span>}
              </div>
            </div>
          ))}
          {!isLoading && !loadErr && !isEmpty && list.length === 0 && <div className="empty-tab"><div className="et-ic"><Icon name="search" size={26} /></div>No categories match that search.</div>}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <div className="del-overlay" onClick={() => { setDeleteTarget(null); setDeleteResult(null); }}>
            <div className="del-modal" onClick={(e) => e.stopPropagation()}>
              <div className="del-header">
                <Icon name="x" size={18} style={{ color: 'var(--c-red)' }} />
                <div>
                  <div className="del-title">{deleteResult ? 'Category Deleted' : 'Delete Category'}</div>
                  <div className="del-name">{deleteTarget.name}</div>
                </div>
                <button className="del-close" onClick={() => { setDeleteTarget(null); setDeleteResult(null); }}><Icon name="x" size={16} /></button>
              </div>

              {/* Dry Run Result */}
              {deleteLoading && <div className="del-body"><Icon name="refresh" size={16} className="spin" /> Loading impact analysis…</div>}

              {dryRunResult && !deleteResult && (
                <div className="del-body">
                  {dryRunResult.error ? (
                    <div style={{ color: 'var(--c-red)' }}>{dryRunResult.error}</div>
                  ) : (
                    <>
                      <div className="del-summary">
                        <span className="del-stat"><b>{dryRunResult.summary?.total_dynamo_records || 0}</b> database records</span>
                        <span className="del-stat"><b>{dryRunResult.summary?.total_s3_objects || 0}</b> S3 objects</span>
                        <span className="del-stat"><b>{dryRunResult.summary?.total || 0}</b> total items</span>
                      </div>
                      <div className="del-details">
                        {dryRunResult.resources?.files?.count > 0 && <div className="del-row"><Icon name="file" size={13} /> {dryRunResult.resources.files.count} file records</div>}
                        {dryRunResult.resources?.jobs?.count > 0 && <div className="del-row"><Icon name="skip" size={13} /> {dryRunResult.resources.jobs.count} processing jobs</div>}
                        {dryRunResult.resources?.s3_swarm_output?.count > 0 && <div className="del-row"><Icon name="database" size={13} /> {dryRunResult.resources.s3_swarm_output.count} extraction/enrichment artifacts</div>}
                        {dryRunResult.resources?.interview_sessions?.count > 0 && <div className="del-row"><Icon name="chat" size={13} /> {dryRunResult.resources.interview_sessions.count} interview sessions</div>}
                        {dryRunResult.resources?.s3_input_files?.count > 0 && <div className="del-row"><Icon name="send" size={13} /> {dryRunResult.resources.s3_input_files.count} uploaded files (S3)</div>}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Delete Complete */}
              {deleteResult && (
                <div className="del-body">
                  {deleteResult.error ? (
                    <div style={{ color: 'var(--c-red)' }}>{deleteResult.error}</div>
                  ) : (
                    <div style={{ color: 'var(--c-green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon name="check" size={16} /> All data for "{deleteTarget.name}" has been permanently deleted.
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="del-footer">
                {!deleteResult ? (
                  <>
                    <button className="gbtn" onClick={() => { setDeleteTarget(null); setDeleteResult(null); }}>Cancel</button>
                    <button className="gbtn danger" onClick={handleConfirmDelete} disabled={deleteLoading || !!dryRunResult?.error}>
                      <Icon name="x" size={14} /> Delete permanently
                    </button>
                  </>
                ) : (
                  <button className="gbtn primary" onClick={() => { setDeleteTarget(null); setDeleteResult(null); }}>Close</button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryPage({ islandVariant, motion }) {
  const [view, setView] = useCatS(() => {
    const path = window.location.pathname;
    if (path === '/category-management/new') return 'onboard';
    const match = path.match(/^\/category-management\/([a-f0-9-]{36})/);
    if (match) return 'onboard';
    return 'directory';
  });
  const [resumeCategory, setResumeCategory] = useCatS(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/category-management\/([a-f0-9-]{36})/);
    if (match) return { category_id: match[1] };
    return null;
  });

  // Sync view state when URL changes (e.g. sidebar nav or browser back/forward)
  React.useEffect(() => {
    const syncView = () => {
      const path = window.location.pathname;
      if (path === '/category-management' || path === '/category-management/') {
        setView('directory');
        setResumeCategory(null);
      } else if (path === '/category-management/new') {
        setView('onboard');
        setResumeCategory(null);
      } else {
        const match = path.match(/^\/category-management\/([a-f0-9-]{36})/);
        if (match) {
          setView('onboard');
          setResumeCategory((prev) => (prev && prev.category_id === match[1]) ? prev : { category_id: match[1] });
        }
      }
    };
    window.addEventListener('popstate', syncView);
    return () => window.removeEventListener('popstate', syncView);
  }, []);

  // Detect when pathname changes from external navigation (sidebar pushState)
  const lastPathRef = React.useRef(window.location.pathname);
  React.useEffect(() => {
    const path = window.location.pathname;
    if (path === lastPathRef.current) return;
    lastPathRef.current = path;
    if (path === '/category-management' || path === '/category-management/') {
      setView('directory');
      setResumeCategory(null);
    } else if (path === '/category-management/new') {
      setView('onboard');
      setResumeCategory(null);
    } else {
      const match = path.match(/^\/category-management\/([a-f0-9-]{36})/);
      if (match) {
        setView('onboard');
        setResumeCategory((prev) => (prev && prev.category_id === match[1]) ? prev : { category_id: match[1] });
      }
    }
  });

  function handleOpenCategory(card) {
    setResumeCategory(card);
    setView('onboard');
    window.history.pushState(null, '', `/category-management/${card.category_id}`);
  }

  function handleStartNew() {
    setResumeCategory(null);
    setView('onboard');
    window.history.pushState(null, '', '/category-management/new');
  }

  function handleExit() {
    setView('directory');
    setResumeCategory(null);
    window.history.pushState(null, '', '/category-management');
  }

  return view === 'directory'
    ? <CategoryDirectory onStartOnboard={handleStartNew} onOpenCategory={handleOpenCategory} />
    : <CategoryOnboard key={resumeCategory ? resumeCategory.category_id : 'new'} islandVariant={islandVariant} motion={motion} onExit={handleExit} resumeCategory={resumeCategory} />;
}

Object.assign(window, { CategoryPage, CategoryDirectory });

class CategoryErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('CategoryManagement crash:', error, info.componentStack); }
  render() {
    if (this.state.error) return (
      <div style={{ padding: 40, color: '#ff453a', fontFamily: 'monospace', fontSize: 13, whiteSpace: 'pre-wrap' }}>
        <h2 style={{ color: '#ff453a' }}>Component Error</h2>
        <p>{this.state.error.message}</p>
        <pre>{this.state.error.stack}</pre>
        <button onClick={() => this.setState({ error: null })} style={{ marginTop: 16, padding: '8px 16px', borderRadius: 8, background: '#333', color: '#fff', border: 0, cursor: 'pointer' }}>Try again</button>
      </div>
    );
    return this.props.children;
  }
}

function CategoryPageWrapped(props) {
  return <CategoryErrorBoundary><CategoryPage {...props} /></CategoryErrorBoundary>;
}

export default CategoryPageWrapped;
