# Privacy Atlas

**GitHub repository:** [johnnysessa/privacy-atlas](https://github.com/johnnysessa/privacy-atlas)

**Public website:** [Open Privacy Atlas](https://privacy-atlas-john.johnnytsunami14.chatgpt.site)

The website is publicly accessible. Hosting access is managed separately from the immutable Ootle testnet record.

An immutable Ootle research-snapshot component is deployed on **Esmeralda testnet**.
See [`contracts/`](contracts/README.md) for the accepted deployment details.
The historical receipt-recorded fingerprint is retained in the source artifacts;
the website no longer displays an Ootle research record section. The original edition remains
in contracts/artifacts for historical integrity, outside the served website.

Cryptocurrency research dashboard with market comparisons, privacy protocol
summaries, editorial privacy scores and interactive historical charts. No wallet connection is included.

Coverage combines CoinGecko's privacy-coins category with a curated privacy ecosystem.
The September 18, 2026 expansion adds 21 projects, bringing the bundled list to 74.
`dist/ecosystem.js` is the shared registry for supplemental market refreshes, research,
profiles and overlapping focus labels: privacy payments, confidential computing,
private smart contracts, privacy infrastructure and privacy-focused applications.
Project focus is searchable and filterable. Inclusion does not imply private token
transfers or an investment endorsement. New entries have source-linked privacy,
security and future-direction summaries; their transfer privacy scores remain unrated.
Identity matching uses CoinGecko IDs, not ticker symbols (Midnight is `midnight-3`).
`dist/data/curated-identities.json` preserves coverage when quotes are unavailable;
refreshes retain previous quotes and timestamps rather than removing missing assets.

Each asset now has a project overview, developer/team field, repository ownership,
GitHub push timestamp, source-license status and mining-algorithm field. Verified
team roles are distinguished from historical GitHub contributors (which can
include upstream authors). Missing information is explicitly unknown, never
treated as closed source or evidence of inactivity. Open-source status is scoped
to the tracked repository; known permissive/copyleft SPDX identifiers are recognized.
Public repositories without a confirmed license are shown separately.

`python scripts/project-data.py` refreshes vendor metadata and PNG logos;
`--missing` only retries assets without metadata. Requests are paced, but source
rate limits may still apply. `python scripts/repo-data.py` refreshes selected
project repositories. `python scripts/contributors.py` fetches historical
contributor lists. `python scripts/logos.py` saves original PNG/JPEG/WebP logos.
Run collectors sequentially; do not publish while they are writing data files.
The logo manifest preserves exact asset ID and source URL. Local logos are used
first, with the provider image as fallback and a ticker placeholder on failure.
GitHub activity can be refreshed for the selected repository from the dashboard;
this update lasts for the browser session. It is a push timestamp, not a release
date or necessarily a default-branch code change. Source checks are timestamped.

Price forecasts and their model have been removed from the website.

Run `npm test` for chart, market data and disclosure checks. Serve `dist/` over HTTP.
`npm run snapshot` fetches the CoinGecko privacy-coins category, curated supplemental
quotes and historical series. The browser automatically refreshes market prices on each page load and
when a page is restored from the back/forward cache. Provider requests bypass the
browser HTTP cache. The snapshot and its timestamps remain visible if a refresh
fails. Manual market and selected-history refreshes are also available.
Charts load automatically when an asset or time frame is selected, with one
automatic attempt per asset and range per page session. Ranges are 1D, 7D,
1M (30 days), 3M (90 days), 6M (180 days), 1Y (365 days), and All time. Shorter ranges retain intraday
samples. Hover, touch or keyboard arrows reveal the nearest recorded timestamp
and price; the time axis uses actual timestamps. Each range has separate cached
data and loading/error states, so late responses cannot replace another range. CoinGecko is the primary historical source.
MinoTari has an explicitly mapped MEXC XTM/USDT fallback using completed
candles, dated at their closing time. Charts identify their source, currency and actual date range; USDT
candles are never labeled USD. Failed requests retain existing chart data.
The manual history button retries failed requests. MinoTari also includes a
saved CoinGecko history. The fallback has automated parsing tests; live MEXC
availability could not be confirmed during this update.
API rate limits and CORS/network failures are surfaced without fabricated data.

Coverage combines the provider category and curated ecosystem additions; it is not exhaustive.
Limited-evidence entries explicitly describe unknown protocol and roadmap details. Zero/missing cap or supply is
displayed as unreported. Editorial profiles cite project sources and review dates.
Roadmaps are project-stated goals, not guaranteed outcomes.

Privacy scores are ordinal editorial assessments with source links and rationales.
20 covered assets have ratings; others explicitly show N/A. They are not audits,
anonymity probabilities, or investment ratings. Chart samples exclude intraday data.
Vendor maximum
supply does not establish a hard protocol cap. No audited unlock calendar, fee
feed, revenue, or staking APY is provided. Browser and WebMCP execution have not
been validated; syntax, source paths and numerical tests are checked locally.

Monero includes timestamped CoinGecko fallback data for all seven chart ranges.
Successful chart downloads are retained locally (up to 20 asset/range entries),
with fresher data preferred over bundled copies. Saved windows retain their
original dates so temporary API failures do not erase charts. Old data is labeled,
and live refreshes are attempted when cached data is over five minutes old.
Rapid range changes are debounced to avoid unnecessary requests.

Chart fallback coverage can be refreshed with `python scripts/check-chart-coverage.py`.
It checks every asset in the saved market universe and writes per-asset history
plus a coverage report. Shorter saved windows may contain daily samples; fresh
intraday requests still run when available. Actual timestamps and sampling
labels remain visible. CoinGecko rate limits trigger a brief client cooldown.
Market quote updates merge independently, preserving valid prices when another
request fails, and never replace a good quote with a missing or older price.

The 2026-09-18 coverage check saved 264 of 265 asset/range combinations
across 53 assets. Karbo lacked enough verified 1-day prices; its longer ranges
are available. All saved ranges pass a simulated provider-outage rendering test.

Long ranges can be refreshed with `python scripts/extend-history.py`. All time requests maximum provider history, falling back to the public one-year window when unrestricted history is unavailable. Coverage limits and actual first/last sample dates are shown; this is not a promise of lifetime coverage. The saved coverage report records per-asset annual-fetch failures. No prices are synthesized.

### Development activity

The asset table includes a sortable development activity rating. Select an asset
for the evidence, repository scope, observation dates and scoring breakdown.
The 90-day score uses distinct eligible commit authors (35%, capped at 10),
non-merge/non-bot commit volume (30%, capped at 150), active weekly buckets (20%,
13 buckets) and eligible commit recency (15%). Recency awards 1.5/1/0.5/0 points
for the latest eligible commit within 7/30/60/more days. Scores are rounded only
after summing the components. Author identities are an imperfect proxy for
active contributors, not verified developer headcount.

Merged pull requests, stable releases, open issues plus PRs, repository status
and last push are shown as context and do not affect the score. Repository
activity is not a code-quality, security or investment rating. Scoring covers the
tracked default branch, not the whole project; forks can include upstream work.
The interface explains alias, bot, co-author, squash-merge and timestamp limits.

`dist/data/development.json` contains dated aggregate observations and source
URLs, not raw author emails or commit messages. `node scripts/development-snapshot.mjs`
refreshes the saved evidence through GitHub's public API. Requests are paginated
and pinned to a branch-head commit. The browser uses the same collector and
scoring functions; a selected observation older than a day is refreshed once per
page load, and the user can refresh manually. No browser API keys are required.
Rate limits can prevent refreshes; the last complete observation is retained.
Incomplete data receives no score, partial counts are lower bounds, saved data
over 7 days old is flagged, and observations older than 30 days are not rated.
Assets without a tracked repository remain explicitly unrated.

September 19 evidence expansion: five provisional native-transfer privacy ratings cite project documentation (Ryo, Nerva, Ycash, Particl, Epic Cash). New ratings exclude planned upgrades. Development evidence now covers 44 assets; nine additional scores use complete 90-day histories from the selected repositories. API-limited histories remain unscored, and release/PR context is not substituted for commit evidence. Refresh missing scores with `node scripts/development-snapshot.mjs --missing`.

September 19 category review: assigned documented roles to 19 previously unclassified assets. Categories describe project focus, not confirmed feature deployment or transfer confidentiality. Fourteen assets remain unclassified where source attribution or purpose is unresolved. Source links and limitations remain in each asset’s research.

Privacy-model review (September 19): eight additional models use wallet instructions, core repository documentation, cryptography documentation and a dated roadmap. Model labels are centralized in `dist/privacy-models.js` for table display, filtering and detail evidence. Visible unreviewed models fall from 35 to 27; five previously scored models also now filter consistently. Planned privacy is explicitly separate from live protection, and no numerical scores are changed.
