import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simulate } from '../public/model.js';
const base = { income: 3000, rent: 1400, subsidy: 500, ceiling: 1100, households: 1000, growth: 10, policy: 'assistance', quantum: false };
test('South Shore demo reaches the 30% target with a $500 subsidy', () => {
  const r = simulate(base);
  assert.equal(r.payment, 900); assert.equal(r.burden, 30); assert.equal(r.affordable, true); assert.equal(r.annualBudget, 6000000);
});
test('assistance cannot exceed rent or produce a negative payment', () => {
  const r = simulate({ ...base, subsidy: 2000 });
  assert.equal(r.payment, 0); assert.equal(r.annualBudget, 16800000);
});
test('quantum demand assumption changes all scenarios consistently', () => {
  const r = simulate({ ...base, quantum: true });
  assert.ok(Math.abs(r.marketRent - 1540) < 1e-8); assert.ok(Math.abs(r.payment - 1040) < 1e-8); assert.equal(r.affordable, false);
});
test('ceiling never increases rent and does not allocate assistance spending', () => {
  const r = simulate({ ...base, policy: 'ceiling', ceiling: 2000 });
  assert.equal(r.payment, 1400); assert.equal(r.annualBudget, 0);
});
test('current conditions have no savings or program spending', () => {
  const r = simulate({ ...base, policy: 'current' });
  assert.equal(r.payment, 1400); assert.equal(r.savings, 0); assert.equal(r.annualBudget, 0);
});
test('invalid inputs are rejected', () => {
  assert.throws(() => simulate({ ...base, income: 0 }));
  assert.throws(() => simulate({ ...base, rent: NaN }));
  assert.throws(() => simulate({ ...base, households: -1 }));
});
