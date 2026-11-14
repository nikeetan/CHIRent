export const usd = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
export function simulate({ income, rent, subsidy, ceiling, households, growth, policy, quantum }) {
  const values = { income, rent, subsidy, ceiling, households, growth };
  for (const [key, value] of Object.entries(values)) {
    if (!Number.isFinite(value) || value < 0) throw new Error(`Invalid ${key}`);
  }
  if (income <= 0) throw new Error('Income must be greater than zero');
  if (!['current', 'assistance', 'ceiling'].includes(policy)) throw new Error('Unknown policy');
  const marketRent = rent * (quantum ? 1 + growth / 100 : 1);
  const assistance = Math.min(subsidy, marketRent);
  const payments = { current: marketRent, assistance: Math.max(0, marketRent - assistance), ceiling: Math.min(marketRent, ceiling) };
  const payment = payments[policy];
  return { marketRent, payments, payment, burden: payment / income * 100, beforeBurden: marketRent / income * 100, savings: marketRent - payment, affordable: payment <= income * .3 + 1e-8, annualBudget: policy === 'assistance' ? assistance * Math.floor(households) * 12 : 0, assistance, gap: Math.max(0, payment - income * .3) };
}
// Entirely synthetic demo assumptions. These are NOT CMAP or HUD estimates.
export function demoFor(name, index = 0) {
  const examples = {
    'SOUTH SHORE': [3000, 1400, 1000], 'SOUTH CHICAGO': [2800, 1250, 850],
    'WOODLAWN': [3200, 1450, 900], 'HYDE PARK': [4800, 1750, 600],
    'EAST SIDE': [3500, 1300, 700], 'SOUTH DEERING': [3100, 1200, 650],
    'ROGERS PARK': [3700, 1450, 800], 'LOGAN SQUARE': [5200, 1850, 750]
  };
  const v = examples[name.toUpperCase()] || [2800 + (index * 317 % 3100), 1100 + (index * 137 % 1100), 500 + (index * 73 % 1100)];
  return { name: name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()), income: v[0], rent: v[1], households: v[2] };
}
