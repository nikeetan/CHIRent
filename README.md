# ChiRent — Housing Policy Lab

Explore Chicago housing affordability and compare hypothetical policies using editable demonstration assumptions.

## Run

Requires Node.js 20+. No dependencies or API keys required.

```bash
npm run dev    # http://localhost:5173
npm test       # Calculation tests
npm run build  # Static website in dist/
```

Deploy `dist/` to a static host, including a project subpath such as `/CHIRent/`. All assets and map data use relative URLs. Optional Google Fonts fall back to system fonts offline. Use `PORT=3000 npm run dev` to change the port.

## Sign in

**Username: `admin` · Password: `admin`**

This is a public demo sign-in gate, not secure authentication. Credentials and all site files are public. Do not store private data in this app. Sessions are kept in this browser tab's `sessionStorage`, expire after eight hours, and are removed on sign-out. Reloading restores a valid session. If browser storage is unavailable, sign-in still works for the current page. Policy assumptions reset on reload; the URL preserves the active workspace view.

## GitHub Pages

The workflow at `.github/workflows/pages.yml` tests, builds, and deploys pushes to `main` and `Feature-Branch-V1`. Set **Settings → Pages → Source → GitHub Actions**. Deployments use the `github-pages` environment. Allow the publishing branch in that environment if branch restrictions are configured. Do not change a custom domain or existing protection rules without reviewing them.

Published URL: **https://nikeetan.github.io/CHIRent/**

To reproduce the GitHub Pages layout locally:

```bash
npm run build
BASE_PATH=/CHIRent STATIC_DIR=dist npm run dev
# Open http://localhost:5173/CHIRent/
```

Optional full browser QA uses Chrome and Playwright (`npm install --no-save playwright`, then `node scripts/check-browser.mjs` against the preview above). This checks login/error states, reload/sign-out, subpath assets, all 77 areas, policy scenarios, export, and mobile layout. `TEST_URL` overrides the target; `PLAYWRIGHT_MODULE` can point to a separately installed Playwright module.

## Features and demo

- Interactive map with all 77 community areas and an accessible community selector.
- Editable monthly income and rent; current conditions, rental assistance, and research-only rent ceiling scenarios.
- Before/After buttons update the payment, affordability status, income-allocation pie chart, and map colors.
- Bar graph compares all policies against a 30% income target.
- Annual direct assistance budget using an assumed eligible-household count.
- Quantum Development Impact view with an assumed rent increase and an approximate IQMP site marker.
- Rule-based scenario explainer; no external AI service.
- Responsive layout, keyboard map selection, validation, reset, and Sources & Methodology view.
- Dedicated sign-in page, password visibility control, account menu, session restoration, and sign-out.
- Hash-based navigation supports browser back/forward and direct view links.
- CSV scenario reports include assumptions, before/after values, assistance budgets, and limitations.

Demo South Shore: **$3,000 income**, **$1,400 rent**, **$500 subsidy**. Before: **$1,400 / 46.7%**. After: **$900 / 30.0%**. For 1,000 assumed households, annual direct assistance is **$6,000,000**. In Quantum Impact view, a hypothetical 10% rent increase yields **$1,540 market rent**, **$1,040 tenant payment / 34.7%** with the same subsidy. These are scenarios, not predictions.

## Data provenance

**All income, rent, eligible-household counts, affordability map colors, and demand changes are synthetic assumptions.** Only the geographic boundaries are imported.

- [City of Chicago Community Areas](https://data.cityofchicago.org/d/igwz-8jzy): 77-area GeoJSON downloaded November 14, 2026; bundled in `public/data/communities.geojson`.
- [CMAP snapshots](https://cmap.illinois.gov/data/community-data-snapshots/): reference for future observed-data integration; no housing values imported.
- [HUD SAFMR](https://www.huduser.gov/portal/datasets/fmr/smallarea/index.html): reference only; ZIP/bedroom program benchmarks are not rent ceilings.
- [IQMP](https://iqmp.org/about/): development context for the former South Works site. The site marker is approximate.
- [50 ILCS 825](https://www.ilga.gov/Legislation/ILCS/Articles?ActID=748&ChapterID=11&Print=True): local private-market rent controls are prohibited; the ceiling is research-only.
- The provided Google Sheet was not imported because access could not be verified.

The suggested summit starter was reviewed. This is an independent vanilla JavaScript implementation using a dependency-free Node server, compatible with the workspace's Node 20 installation.

## Methodology and limits

Market rent = base rent × (1 + assumed increase). The increase applies only in Quantum Impact view.

- Current conditions: payment = market rent.
- Assistance: payment = max(0, market rent − subsidy).
- Ceiling: payment = min(market rent, ceiling).
- Housing share = payment ÷ income × 100.
- Annual direct assistance = min(subsidy, market rent) × whole eligible households × 12.

The bar chart always compares all three policies. Before/After changes the active payment and income chart; the budget reflects the selected intervention. If payment exceeds income, the pie is capped at 100% and the shortfall is displayed. Community selection resets that area's synthetic baseline. Reset demo restores the original South Shore example.

No behavior, housing supply response, eligibility, administrative costs, utility costs, public costs other than direct assistance, or causal IQMP effects are modeled. Incomes must be positive. Rent, subsidy, and household counts must be nonnegative. Eligible-household counts are assumptions, not census counts.

Real housing-data ingestion and an API-backed AI assistant remain extensions. Secure authentication requires an external identity service and server-enforced authorization; the static demo gate does not provide either.
