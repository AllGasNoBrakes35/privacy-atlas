# Privacy Atlas

**Public website:** [Open Privacy Atlas](https://privacy-atlas-john.johnnytsunami14.chatgpt.site)

The website is publicly accessible. Hosting access is managed separately from
the immutable Ootle testnet record; making the site public does not change that record.

An immutable Ootle research-snapshot component is deployed on **Esmeralda testnet**.
See [`contracts/`](contracts/README.md) for the accepted deployment details.
The dashboard shows the historical receipt-recorded fingerprint; it does not verify
the current website or perform live indexer queries. The original edition remains
in contracts/artifacts for historical integrity, outside the served website.

Cryptocurrency research dashboard with market comparisons, privacy protocol
summaries, editorial privacy scores and interactive historical charts. No wallet connection is included.
Click anywhere on a cryptocurrency row to open its project details.

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
`npm run snapshot` fetches the CoinGecko privacy-coins category and historical
series. The browser automatically refreshes market prices on each page load and
when a page is restored from the back/forward cache. Provider requests bypass the
browser HTTP cache. The snapshot and its timestamps remain visible if a refresh
fails. Manual market and selected-history refreshes are also available.
Charts load automatically when an asset or time frame is selected, with one
automatic attempt per asset and range per page session. Ranges are 1D, 7D,
1M (30 days), 3M (90 days) and 6M (180 days). Shorter ranges retain intraday
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

Coverage is the provider category, not all privacy coins. Unreviewed assets have
explicitly unknown protocol and goal summaries. Zero/missing cap or supply is
displayed as unreported. Editorial profiles cite project sources and review dates.
Roadmaps are project-stated goals, not guaranteed outcomes.

Privacy scores are ordinal editorial assessments with source links and rationales.
15 covered assets have ratings; others explicitly show Not rated. They are not audits,
anonymity probabilities, or investment ratings. Chart samples exclude intraday data.
Vendor maximum
supply does not establish a hard protocol cap. No audited unlock calendar, fee
feed, revenue, or staking APY is provided. Browser and WebMCP execution have not
been validated; syntax, source paths and numerical tests are checked locally.

Monero includes timestamped CoinGecko fallback data for all five chart ranges.
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
