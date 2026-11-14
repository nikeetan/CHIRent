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
    $('login-error').textContent = 'Incorrect credentials — use admin for both username and password';
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
  notify(persisted ? 'Your policy workspace is ready' : 'Browser storage unavailable — sign in again after reloading');
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
  showLogin(); window.scrollTo(0, 0); $('username').focus(); notify('Signed out of the demo workspace');
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
  ['Chicago community boundaries', 'Official City of Chicago geography with 77 selectable areas\nHousing values and affordability colors are synthetic', 'https://data.cityofchicago.org/d/igwz-8jzy'],
  ['CMAP community snapshots', 'Reference for future housing and employment data integration\nNo CMAP housing values are imported in this demonstration', 'https://cmap.illinois.gov/data/community-data-snapshots/'],
  ['HUD Small Area Fair Market Rents', 'ZIP code and bedroom specific housing program benchmarks\nReference only and not a source of rent ceilings', 'https://www.huduser.gov/portal/datasets/fmr/smallarea/index.html'],
  ['Illinois Quantum and Microelectronics Park', 'Development context for the former South Works site\nNo causal rent effects or employment outcomes are estimated', 'https://iqmp.org/about/'],
  ['Illinois Rent Control Preemption Act', '50 ILCS 825 prohibits local private market rent controls\nThe rent ceiling is a research scenario rather than an available city policy', 'https://www.ilga.gov/Legislation/ILCS/Articles?ActID=748&ChapterID=11&Print=True'],
  ['Project spreadsheet', 'Not imported because access could not be verified\nAll monetary values and eligible household counts remain editable demo assumptions', 'https://docs.google.com/spreadsheets/d/1LDyUA7WNWr3IH-DrIeTAkGO7JQLVWJ_s8hmzxP-aEUI/edit?gid=1860674826']
];
$('sources-view').innerHTML = `<div class="source-banner"><strong>Transparent assumptions</strong><p>Official community boundaries and linked development context support this scenario calculator</p><p>Income and rent values are synthetic assumptions rather than observed data or forecasts</p></div><div class="source-grid">${sources.map(([name, description, url]) => `<article class="card source-card"><h2>${name}</h2><p>${description}</p><a href="${url}" target="_blank" rel="noreferrer">View source ↗</a></article>`).join('')}<article class="card source-card"><h2>Calculation methodology</h2><ul><li>Market rent equals base rent multiplied by the assumed increase factor</li><li>Rental assistance reduces the tenant payment and is capped at rent</li><li>The research ceiling caps payment at the selected ceiling</li><li>Housing share equals tenant payment divided by monthly income</li><li>The demonstration affordability target is 30% of income</li><li>Annual direct assistance equals the monthly subsidy multiplied by eligible households and 12 months</li></ul></article><article class="card source-card"><h2>Scope and limitations</h2><ul><li>No housing supply or behavioral response is modeled</li><li>Administration and program eligibility are excluded</li><li>Eligible household counts are assumptions rather than census estimates</li><li>Quantum Impact applies the rent assumption while income and assistance stay constant</li><li>The scenario explainer uses rules rather than an AI service</li><li>Changing community restores its demo baseline</li></ul></article></div>`;

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
      throw new Error(k === 'income' ? 'Enter a monthly income greater than zero' : `Enter a valid nonnegative ${k} within the input limits`);
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
  $('breadcrumb').textContent = view === 'quantum' ? 'Quantum development impact' : sourceView ? 'Data and methodology' : 'Policy simulator';
  $('page-title').innerHTML = sourceView ? 'Data and <em>methodology</em>' : view === 'quantum' ? 'Quantum development <em>impact</em>' : 'Housing policy <em>simulator</em>';
  $('page-eyebrow').textContent = sourceView ? 'DATA TRANSPARENCY' : view === 'quantum' ? 'SOUTH WORKS DEVELOPMENT SCENARIOS' : 'CHICAGO POLICY INTELLIGENCE';
  $('page-description').textContent = sourceView ? 'Review the evidence and assumptions behind each scenario' : view === 'quantum' ? 'Explore hypothetical rent increases while household income and assistance stay constant' : 'Compare housing interventions and evaluate their impact on household affordability';
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
  $('policy-explanation').textContent = policy === 'assistance' ? 'Assistance reduces the tenant payment while landlord rent stays unchanged' : policy === 'ceiling' ? 'Research ceiling applied without modeling supply or landlord response' : 'No intervention applied to the modeled market rent';
  $('before').classList.toggle('active', !after); $('before').setAttribute('aria-pressed', String(!after));
  $('after').classList.toggle('active', after); $('after').setAttribute('aria-pressed', String(after));
  document.querySelectorAll('[data-policy]').forEach(b => {
    const active = b.dataset.policy === policy; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active));
  });
  $('chart-context').textContent = `${selected} ${after ? 'after policy' : 'before policy'}`;
  $('pie-mode').textContent = after ? 'After' : 'Before';
  const part = Math.min(100, burden);
  $('donut').style.background = `conic-gradient(var(--chart-payment) 0% ${part}%, var(--chart-remaining) ${part}% 100%)`;
  $('donut').setAttribute('aria-label', `${burden.toFixed(1)} percent of income spent on tenant housing. Payment ${usd(payment)}. Income remaining ${usd(Math.max(0, v.income - payment))}.`);
  $('donut-percent').textContent = `${burden.toFixed(1)}%`;
  $('pie-payment').textContent = usd(payment);
  $('pie-remaining').textContent = usd(Math.max(0, v.income - payment));
  $('pie-note').textContent = burden > 100 ? `${usd(payment - v.income)} exceeds income — ring capped at 100%` : 'Monthly household income allocation';
  const max = Math.max(r.marketRent, v.income * .3, 1) * 1.12;
  $('bar-chart').innerHTML = Object.entries(r.payments).map(([p, amount]) => `<div class="bar-row"><span>${p === 'current' ? 'No intervention' : p === 'ceiling' ? 'Rent ceiling' : 'Assistance'}</span><div class="bar-track"><div class="bar-fill" style="width:${amount / max * 100}%;background:var(${p === 'assistance' ? '--chart-payment' : p === 'ceiling' ? '--chart-ceiling' : '--chart-current'})"></div><i class="bar-target-line" style="left:${v.income * .3 / max * 100}%"></i></div><strong>${usd(amount)}</strong></div>`).join('');
  $('bar-chart').setAttribute('aria-label', `Monthly payments: no intervention ${usd(r.payments.current)}, research-only rent ceiling ${usd(r.payments.ceiling)}, assistance ${usd(r.payments.assistance)}. 30 percent income target ${usd(v.income * .3)}.`);
  $('bar-target').textContent = usd(v.income * .3);
  $('budget').textContent = policy === 'assistance' ? usd(r.annualBudget) : 'Not applicable';
  $('budget-formula').textContent = policy === 'assistance' ? `${fmt(Math.floor(v.households))} households × ${usd(r.assistance)} × 12 months` : 'Select rental assistance to estimate direct subsidy costs';
  updateInsight(v, r);
  updateMap(v);
}
function updateInsight(v, r) {
  let text, title;
  if (question === 'quantum') {
    title = 'Housing stability under changing demand';
    text = `An assumed ${v.growth}% rent increase would bring monthly rent to ${usd(v.rent * (1 + v.growth / 100))}\nIncome and subsidy remain unchanged in this scenario\nThis is a hypothetical stress test rather than an IQMP forecast\nEmployment access and training pathways are outside this model`;
  } else if (question === 'budget') {
    title = 'Direct assistance funding requirements';
    text = policy === 'assistance' ? `${fmt(v.households)} assumed households receiving ${usd(r.assistance)} monthly require ${usd(r.annualBudget)} in annual direct assistance\nPayments are capped at modeled rent\nAdministration and eligibility verification are excluded` : 'Select rental assistance to estimate direct subsidy costs\nOther policies do not allocate a rental subsidy budget in this model';
  } else {
    title = r.affordable ? 'Affordability target achieved' : 'Remaining affordability gap';
    text = `The assumed ${selected} household spends ${r.beforeBurden.toFixed(1)}% of income on housing before policy\n${policyNames[policy]} brings the monthly payment to ${usd(r.payment)} and the income share to ${r.burden.toFixed(1)}%\n${r.affordable ? 'The modeled payment meets the 30% affordability target' : `An additional ${usd(r.gap)} monthly reduction would reach the 30% target`}\nThese figures represent an assumed household rather than a typical resident`;
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
    path.setAttribute('fill', burden <= 30 ? 'var(--map-low)' : burden <= 50 ? 'var(--map-medium)' : 'var(--map-high)');
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
    marker.innerHTML = `<circle cx="${cx}" cy="${cy}" r="9" fill="var(--red)" stroke="#fff" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="3" fill="#fff"/><text x="${cx - 13}" y="${cy + 4}" text-anchor="end" font-family="var(--font-ui)" font-size="9" fill="var(--blue-dark)">IQMP South Works</text>`;
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
  choose('South Shore'); navigate('simulator'); notify('South Shore demonstration restored');
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
  notify('Scenario report exported with assumptions and limitations');
});
$('page-title').setAttribute('tabindex', '-1');
$('export').setAttribute('aria-label', 'Export scenario as CSV');
$('reset').setAttribute('aria-label', 'Reset demonstration');
if (signedIn) showWorkspace(); else showLogin();
