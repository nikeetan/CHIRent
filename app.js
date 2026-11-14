import { simulate, demoFor, usd } from './model.js';
import { readSession, createSession, clearSession, validCredentials } from './auth.js';

const $ = id => document.getElementById(id);
const storage = {
  getItem: key => window.sessionStorage.getItem(key),
  setItem: (key, value) => window.sessionStorage.setItem(key, value),
  removeItem: key => window.sessionStorage.removeItem(key)
};
let signedIn = readSession(storage);
let mapStarted = false;
let toastTimer;
function notify(message) {
  clearTimeout(toastTimer);
  $('toast').textContent = message; $('toast').hidden = false;
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4000);
}
function showWorkspace() {
  $('login-page').hidden = true; $('authenticated-app').hidden = false;
  const requested = location.hash.slice(1);
  const next = ['simulator', 'quantum', 'sources'].includes(requested) ? requested : 'simulator';
  if (requested !== next) history.replaceState(null, '', '#' + next);
  setView(next);
  if (!mapStarted) { mapStarted = true; loadMap(); }
}
function showLogin() {
  $('login-page').hidden = false; $('authenticated-app').hidden = true;
  history.replaceState(null, '', '#login');
  document.title = 'Sign in — ChiRent';
}
function navigate(next) {
  if (!signedIn) return showLogin();
  if (location.hash !== '#' + next) location.hash = next;
  else setView(next);
}
window.addEventListener('hashchange', () => {
  if (!signedIn) return showLogin();
  const next = location.hash.slice(1);
  setView(['simulator', 'quantum', 'sources'].includes(next) ? next : 'simulator');
});
$('login-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!validCredentials($('username').value, $('password').value)) {
    $('login-error').textContent = 'The username or password is incorrect. Use admin / admin for this demonstration.';
    $('login-error').hidden = false;
    $('username').setAttribute('aria-invalid', 'true'); $('password').setAttribute('aria-invalid', 'true');
    $('password').focus(); return;
  }
  const persisted = createSession(storage);
  signedIn = true;
  $('login-error').hidden = true;
  $('username').removeAttribute('aria-invalid'); $('password').removeAttribute('aria-invalid');
  $('password').value = ''; $('password').type = 'password';
  $('toggle-password').textContent = 'Show'; $('toggle-password').setAttribute('aria-pressed', 'false'); $('toggle-password').setAttribute('aria-label', 'Show password');
  showWorkspace(); window.scrollTo(0, 0);
  $('page-title').focus();
  notify(persisted ? 'Welcome, Administrator. Your policy workspace is ready.' : 'Welcome. Browser storage is unavailable; sign in again after reloading.');
});
$('toggle-password').addEventListener('click', () => {
  const show = $('password').type === 'password';
  $('password').type = show ? 'text' : 'password';
  $('toggle-password').textContent = show ? 'Hide' : 'Show';
  $('toggle-password').setAttribute('aria-pressed', String(show));
  $('toggle-password').setAttribute('aria-label', show ? 'Hide password' : 'Show password');
});
for (const id of ['username', 'password']) $(id).addEventListener('input', () => {
  $('login-error').hidden = true;
  $('username').removeAttribute('aria-invalid'); $('password').removeAttribute('aria-invalid');
});
$('logout').addEventListener('click', () => {
  clearSession(storage); signedIn = false;
  $('account-menu').open = false; $('login-form').reset(); $('login-error').hidden = true;
  showLogin(); window.scrollTo(0, 0); $('username').focus(); notify('You have signed out of the demo workspace.');
});
document.addEventListener('click', event => { if (!$('account-menu').contains(event.target)) $('account-menu').open = false; });
document.addEventListener('keydown', event => { if (event.key === 'Escape') $('account-menu').open = false; });
let view = 'simulator', policy = 'assistance', after = true, question = 'affordability';
let areas = ['South Shore', 'South Chicago', 'Woodlawn', 'Hyde Park', 'East Side', 'South Deering', 'Rogers Park', 'Logan Square'].map(demoFor);
let selected = 'South Shore';
let mapFeatures = [];
const fmt = n => new Intl.NumberFormat('en-US').format(n);
const policyNames = { current: 'Current conditions', ceiling: 'Rent ceiling', assistance: 'Rental assistance' };
const sources = [
  ['Chicago community boundaries', 'Official City of Chicago GeoJSON, bundled locally. All 77 community areas are selectable. Geography is real; housing values and map colors are synthetic.', 'https://data.cityofchicago.org/d/igwz-8jzy'],
  ['CMAP Community Data Snapshots', 'Reference for future observed housing, income, and employment indicators across Chicago’s 77 community areas. No CMAP housing values are imported into this demo.', 'https://cmap.illinois.gov/data/community-data-snapshots/'],
  ['HUD Small Area Fair Market Rents', 'ZIP-code and bedroom-specific housing-program benchmarks. Not rent ceilings or community-area estimates. HUD figures are not imported into this demo.', 'https://www.huduser.gov/portal/datasets/fmr/smallarea/index.html'],
  ['Illinois Quantum and Microelectronics Park', 'Development context for the former South Works site. No causal rent effects, job counts, job eligibility, or access forecasts are estimated.', 'https://iqmp.org/about/'],
  ['Illinois Rent Control Preemption Act', '50 ILCS 825, sections 5 and 10 prohibit local private-market rent controls. The ceiling tool is a research simulation and is not presented as a currently available city policy.', 'https://www.ilga.gov/Legislation/ILCS/Articles?ActID=748&ChapterID=11&Print=True'],
  ['User-provided spreadsheet', 'Not imported: access could not be verified during development. All monetary figures and eligible-household counts remain explicit, editable demo assumptions.', 'https://docs.google.com/spreadsheets/d/1LDyUA7WNWr3IH-DrIeTAkGO7JQLVWJ_s8hmzxP-aEUI/edit?gid=1860674826']
];
$('sources-view').innerHTML = `<div class="source-banner"><strong>Know what you’re looking at.</strong><br>This is a transparent scenario calculator, not a forecast or an observed affordability dashboard. Only the map boundaries and linked development/legal context are sourced. Household income, rent, eligible-household counts, and demand changes are synthetic assumptions.</div><div class="source-grid">${sources.map(([name, description, url]) => `<article class="card source-card"><h2>${name}</h2><p>${description}</p><a href="${url}" target="_blank" rel="noreferrer">Open source ↗</a></article>`).join('')}<article class="card source-card"><h2>Calculation methodology</h2><p>Market rent = base rent × (1 + assumed increase). The increase applies only in Quantum Impact view. Tenant payment is market rent for current conditions, max(0, market rent − subsidy) for assistance, and min(market rent, ceiling) for the ceiling scenario.</p><p>Housing share = tenant payment ÷ income. The demonstration affordability target is 30% of income. Annual direct assistance = min(subsidy, market rent) × whole eligible households × 12. Before/After changes the displayed payment and income chart; the comparison chart always shows all three interventions.</p></article><article class="card source-card"><h2>Scope and limitations</h2><p>No behavioral response, housing supply change, administrative costs, utility expenses, program eligibility, take-up, tax effects, or landlord rent response is modeled. The assumed eligible households are not a census count. Incomes must be positive; rent, subsidy, and household counts must be nonnegative.</p><p>The scenario explainer is deterministic, rule-based text. It does not use a language model or send data to an external AI service. Changing community resets income, rent, and household assumptions. Reset demo restores the South Shore example.</p></article></div>`;

function populateAreas() {
  const select = $('community');
  select.replaceChildren();
  areas.sort((a, b) => a.name.localeCompare(b.name)).forEach(a => {
    const option = document.createElement('option'); option.value = a.name; option.textContent = a.name; select.append(option);
  });
  select.value = selected;
}
function choose(name) {
  const area = areas.find(a => a.name === name);
  if (!area) return;
  selected = name; $('community').value = name;
  for (const k of ['income', 'rent', 'households']) $(k).value = area[k];
  render();
}
function inputs() {
  const fields = ['income', 'rent', 'subsidy', 'ceiling', 'households', 'growth'];
  const values = {};
  for (const k of fields) {
    const field = $(k);
    if (field.value.trim() === '' || !field.validity.valid) {
      field.setAttribute('aria-invalid', 'true');
      throw new Error(k === 'income' ? 'Enter a monthly income greater than zero.' : `Enter a valid nonnegative ${k} within the input limits.`);
    }
    field.removeAttribute('aria-invalid'); values[k] = Number(field.value);
  }
  return { ...values, policy, quantum: view === 'quantum' };
}
function setView(next) {
  view = next;
  const sourceView = view === 'sources';
  $('workspace').hidden = sourceView;
  $('sources-view').hidden = !sourceView;
  $('quantum-intro').hidden = view !== 'quantum';
  $('breadcrumb').textContent = view === 'quantum' ? 'Quantum development impact' : sourceView ? 'Data & methodology' : 'Policy simulator';
  $('page-title').innerHTML = sourceView ? 'Evidence & <em>methodology.</em>' : view === 'quantum' ? 'Quantum growth. <em>Community resilience.</em>' : 'Housing policy. <em>Measured impact.</em>';
  $('page-eyebrow').textContent = sourceView ? 'RESEARCH / DATA TRANSPARENCY' : view === 'quantum' ? 'SOUTH WORKS / DEVELOPMENT SCENARIOS' : 'CHICAGO / POLICY INTELLIGENCE';
  $('page-description').textContent = sourceView ? 'Trace the sources, assumptions, and calculations behind every scenario.' : view === 'quantum' ? 'Examine housing stability alongside Chicago’s emerging quantum economy.' : 'Compare interventions and understand the tradeoffs for Chicago households.';
  document.title = `${$('breadcrumb').textContent} — ChiRent`;
  $('export').hidden = sourceView;
  document.querySelectorAll('[data-view]').forEach(b => {
    const active = b.dataset.view === view; b.classList.toggle('active', active); b.setAttribute('aria-current', active ? 'page' : 'false');
  });
  if (!sourceView) render();
}
function render() {
  let v, r;
  try { v = inputs(); r = simulate(v); }
  catch (error) { $('input-error').textContent = error.message; $('input-error').hidden = false; return; }
  $('input-error').hidden = true;
  const payment = after ? r.payment : r.marketRent;
  const burden = payment / v.income * 100;
  const affordable = burden <= 30 + 1e-8;
  $('selected-name').textContent = selected;
  $('map-name').textContent = selected;
  $('map-burden').textContent = `${burden.toFixed(1)}% of income`;
  $('subsidy-value').textContent = usd(v.subsidy);
  $('ceiling-value').textContent = usd(v.ceiling);
  $('growth-value').textContent = `${v.growth}%`;
  $('payment').textContent = usd(payment);
  $('burden').textContent = `${burden.toFixed(1)}%`;
  $('savings').replaceChildren(document.createTextNode(`↓ ${usd(after ? r.savings : 0)} `));
  const perMonth = document.createElement('span'); perMonth.textContent = '/ month'; $('savings').append(perMonth);
  $('target-status').textContent = affordable ? '✓ Meets 30% target' : `${usd(payment - v.income * .3)} above target`;
  document.querySelector('.result-panel').classList.toggle('over-target', !affordable);
  for (const p of ['assistance', 'ceiling', 'current']) $(`${p}-controls`).hidden = policy !== p;
  $('legal-note').hidden = policy !== 'ceiling';
  $('policy-explanation').textContent = policy === 'assistance' ? 'Assistance reduces the tenant’s payment, not the landlord’s rent.' : policy === 'ceiling' ? 'Hypothetical ceiling applied to modeled rent. No supply or landlord response is modeled.' : 'Current conditions apply no intervention to the modeled market rent.';
  $('before').classList.toggle('active', !after); $('before').setAttribute('aria-pressed', String(!after));
  $('after').classList.toggle('active', after); $('after').setAttribute('aria-pressed', String(after));
  document.querySelectorAll('[data-policy]').forEach(b => {
    const active = b.dataset.policy === policy; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active));
  });
  $('chart-context').textContent = `${selected} · ${after ? 'After policy' : 'Before policy'}`;
  $('pie-mode').textContent = after ? 'After' : 'Before';
  const part = Math.min(100, burden);
  $('donut').style.background = `conic-gradient(#648759 0% ${part}%, #e3ebd7 ${part}% 100%)`;
  $('donut').setAttribute('aria-label', `${burden.toFixed(1)} percent of income spent on tenant housing. Payment ${usd(payment)}. Income remaining ${usd(Math.max(0, v.income - payment))}.`);
  $('donut-percent').textContent = `${burden.toFixed(1)}%`;
  $('pie-payment').textContent = usd(payment);
  $('pie-remaining').textContent = usd(Math.max(0, v.income - payment));
  $('pie-note').textContent = burden > 100 ? `${usd(payment - v.income)} exceeds income; ring capped at 100%.` : 'Monthly household income allocation';
  const max = Math.max(r.marketRent, v.income * .3, 1) * 1.12;
  $('bar-chart').innerHTML = Object.entries(r.payments).map(([p, amount]) => `<div class="bar-row"><span>${p === 'current' ? 'No intervention' : p === 'ceiling' ? 'Rent ceiling*' : 'Assistance'}</span><div class="bar-track"><div class="bar-fill" style="width:${amount / max * 100}%;background:${p === 'assistance' ? '#7b9b64' : p === 'ceiling' ? '#c2cfa4' : '#d7b98b'}"></div><i class="bar-target-line" style="left:${v.income * .3 / max * 100}%"></i></div><strong>${usd(amount)}</strong></div>`).join('');
  $('bar-chart').setAttribute('aria-label', `Monthly payments: no intervention ${usd(r.payments.current)}, research-only rent ceiling ${usd(r.payments.ceiling)}, assistance ${usd(r.payments.assistance)}. 30 percent income target ${usd(v.income * .3)}.`);
  $('bar-target').textContent = usd(v.income * .3);
  $('budget').textContent = policy === 'assistance' ? usd(r.annualBudget) : 'Not applicable';
  $('budget-formula').textContent = policy === 'assistance' ? `${fmt(Math.floor(v.households))} households × ${usd(r.assistance)} × 12 months` : 'Select rental assistance to estimate direct subsidy costs.';
  updateInsight(v, r);
  updateMap(v);
}
function updateInsight(v, r) {
  let text, title;
  if (question === 'quantum') {
    title = 'Housing stability can support shared opportunity.';
    text = `At an assumed ${v.growth}% rent increase, the selected household’s rent would be ${usd(v.rent * (1 + v.growth / 100))} before intervention. This is a hypothetical demand scenario, not an IQMP forecast. Housing assistance may support residential stability; access to quantum-related jobs also depends on training, transit, and hiring pathways that are not modeled. Open Quantum Impact to apply this assumption.`;
  } else if (question === 'budget') {
    title = 'A transparent starting point for a program budget.';
    text = policy === 'assistance' ? `For ${fmt(v.households)} assumed eligible households, ${usd(r.assistance)} of assistance per household per month implies ${usd(r.annualBudget)} in annual direct assistance. Payments are capped at modeled rent. Administration, eligibility verification, take-up, and funding limits are excluded.` : 'Choose rental assistance to calculate a direct assistance budget. A rent ceiling or the absence of an intervention does not imply a rental subsidy budget. Other policy and administrative costs are not modeled.';
  } else {
    title = r.affordable ? 'The modeled payment meets the affordability target.' : 'There is still an affordability gap to explore.';
    text = `Using ${selected}’s editable demo assumptions, housing takes ${r.beforeBurden.toFixed(1)}% of monthly income before policy. ${policyNames[policy]} brings the modeled payment to ${usd(r.payment)} (${r.burden.toFixed(1)}%). ${r.affordable ? 'This meets the 30% demonstration target.' : `An additional ${usd(r.gap)} monthly reduction would reach the 30% demonstration target.`} These figures describe this assumed household, not the typical resident.`;
  }
  $('insight-title').textContent = title; $('insight-text').textContent = text;
  document.querySelectorAll('[data-question]').forEach(b => b.classList.toggle('active', b.dataset.question === question));
}
function updateMap(v) {
  for (const { path, area } of mapFeatures) {
    const isSelected = area.name === selected;
    const a = isSelected ? v : { ...v, income: area.income, rent: area.rent };
    const r = simulate(a);
    const burden = (after ? r.payment : r.marketRent) / a.income * 100;
    path.setAttribute('fill', burden <= 30 ? '#b6cea3' : burden <= 50 ? '#d5b984' : '#b87561');
    path.classList.toggle('selected', isSelected);
    path.setAttribute('aria-pressed', String(isSelected));
    const label = `${area.name}: ${burden.toFixed(1)}% demo rent-to-income ratio. Select community.`;
    path.setAttribute('aria-label', label); path.querySelector('title').textContent = label;
  }
}
async function loadMap() {
  try {
    const response = await fetch(new URL('./data/communities.geojson', import.meta.url));
    if (!response.ok) throw new Error('Boundaries unavailable');
    const geo = await response.json();
    if (geo.features.length !== 77) throw new Error('Expected 77 communities');
    const existing = { income: $('income').value, rent: $('rent').value, households: $('households').value };
    areas = geo.features.map(f => demoFor(f.properties.community, Number(f.properties.area_numbe)));
    populateAreas();
    for (const [k, val] of Object.entries(existing)) $(k).value = val;
    const coordinates = geo.features.flatMap(f => f.geometry.coordinates.flat(2));
    const minX = Math.min(...coordinates.map(p => p[0]));
    const maxX = Math.max(...coordinates.map(p => p[0]));
    const minY = Math.min(...coordinates.map(p => p[1]));
    const maxY = Math.max(...coordinates.map(p => p[1]));
    const aspect = Math.cos(41.85 * Math.PI / 180);
    const scale = Math.min(425 / ((maxX - minX) * aspect), 465 / (maxY - minY));
    const xOffset = (500 - (maxX - minX) * aspect * scale) / 2;
    const yOffset = (520 - (maxY - minY) * scale) / 2;
    const project = ([x, y]) => [xOffset + (x - minX) * aspect * scale, yOffset + (maxY - y) * scale];
    const ns = 'http://www.w3.org/2000/svg';
    const svg = $('map'); svg.replaceChildren();
    geo.features.forEach(f => {
      const path = document.createElementNS(ns, 'path');
      const polygons = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates];
      path.setAttribute('d', polygons.flatMap(polygon => polygon.map(ring => ring.map((p, i) => `${i ? 'L' : 'M'}${project(p).map(n => n.toFixed(2)).join(',')}`).join('') + 'Z')).join(''));
      path.setAttribute('fill-rule', 'evenodd'); path.setAttribute('tabindex', '0'); path.setAttribute('role', 'button');
      const title = document.createElementNS(ns, 'title'); path.append(title);
      const area = areas.find(a => a.name.toUpperCase() === f.properties.community.toUpperCase());
      path.addEventListener('click', () => choose(area.name));
      path.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(area.name); } });
      svg.append(path); mapFeatures.push({ path, area });
    });
    const [cx, cy] = project([-87.543, 41.751]);
    const marker = document.createElementNS(ns, 'g'); marker.setAttribute('pointer-events', 'none');
    marker.innerHTML = `<circle cx="${cx}" cy="${cy}" r="9" fill="#163c30" stroke="#fff" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="3" fill="#c1e6b0"/><text x="${cx + 13}" y="${cy + 4}" font-family="sans-serif" font-size="9" fill="#35533b">IQMP · South Works</text>`;
    svg.append(marker);
    render();
  } catch (error) {
    console.error('Map:', error); $('map-error').hidden = false;
    document.querySelector('.map-card .subtle-tag').textContent = `${areas.length} demo areas`;
  }
}

populateAreas();
$('community').addEventListener('change', e => choose(e.target.value));
for (const key of ['income', 'rent', 'subsidy', 'ceiling', 'households', 'growth']) $(key).addEventListener('input', render);
document.querySelectorAll('[data-view]').forEach(b => { b.title = b.textContent.trim(); b.setAttribute('aria-label', b.textContent.trim()); b.addEventListener('click', () => navigate(b.dataset.view)); });
document.querySelectorAll('[data-policy]').forEach(b => b.addEventListener('click', () => { policy = b.dataset.policy; render(); }));
document.querySelectorAll('[data-question]').forEach(b => b.addEventListener('click', () => { question = b.dataset.question; render(); }));
$('before').addEventListener('click', () => { after = false; render(); });
$('after').addEventListener('click', () => { after = true; render(); });
$('sources-link').addEventListener('click', () => { navigate('sources'); window.scrollTo({ top: 0, behavior: 'smooth' }); });
$('reset').addEventListener('click', () => {
  policy = 'assistance'; after = true; question = 'affordability';
  $('subsidy').value = 500; $('ceiling').value = 1100; $('growth').value = 10;
  // Reset all fields even if a previous invalid input prevented rendering.
  choose('South Shore'); navigate('simulator'); notify('South Shore demonstration restored.');
});
$('export').addEventListener('click', () => {
  let v, r;
  try { v = inputs(); r = simulate(v); } catch (error) { notify(error.message); return; }
  const rows = [
    ['ChiRent scenario report', 'SYNTHETIC DEMONSTRATION — NOT A FORECAST'],
    ['Community', selected], ['Exported UTC', new Date().toISOString()], ['View', view], ['Policy', policyNames[policy]],
    ['Monthly income USD', v.income], ['Base monthly rent USD', v.rent], ['Assumed rent increase percent', v.quantum ? v.growth : 0],
    ['Modeled market rent USD', r.marketRent], ['Monthly subsidy assumption USD', v.subsidy], ['Research ceiling assumption USD', v.ceiling],
    ['Before payment USD', r.marketRent], ['After payment USD', r.payment], ['After housing share percent', r.burden],
    ['Monthly savings USD', r.savings], ['Assumed eligible households', v.households], ['Annual direct assistance USD', r.annualBudget],
    ['Limitations', 'No behavior, supply response, eligibility, or administration modeled. Housing data is synthetic. Rent ceiling is research-only.']
  ];
  const csv = rows.map(row => row.map(cell => '"' + String(cell).replaceAll('"', '""') + '"').join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a'); a.href = url; a.download = `ChiRent-${selected.replaceAll(' ', '-')}-${policy}.csv`;
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify('Scenario report exported with assumptions and limitations.');
});
$('page-title').setAttribute('tabindex', '-1');
$('export').setAttribute('aria-label', 'Export scenario as CSV');
$('reset').setAttribute('aria-label', 'Reset demonstration');
if (signedIn) showWorkspace(); else showLogin();
