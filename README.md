# Privacy Atlas

**Public website:** [Open Privacy Atlas](https://privacy-atlas-john.johnnytsunami14.chatgpt.site)

The website is publicly accessible. Hosting access is managed separately from
the immutable Ootle testnet record; making the site public does not change that record.

An immutable Ootle research-snapshot component is deployed on **Esmeralda testnet**.
See [`contracts/`](contracts/README.md) for the accepted deployment details.
The dashboard checks saved research bytes against the receipt-recorded fingerprint;
it does not perform live indexer queries. Refreshed quotes are separate from that edition.

Cryptocurrency research dashboard with market comparisons, privacy protocol
summaries, editorial privacy scores and valuation scenarios. No wallet connection is included.

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

The forecast section has no inputs. It shows 1-, 3- and 5-year base, downside and
upside scenarios for 13 reviewed projects, with project-specific merit and adoption
judgments, explicit supply assumptions and linked project evidence. Other assets
show insufficient evidence. These are editorial scenarios, not validated predictions
or probability intervals. Most dilution rates are illustrative, not audited unlock
schedules. Monero and Grin use approximate linear protocol issuance. Refreshing
quotes recalculates the price anchor but does not update editorial research.

Run `npm test` for valuation and forecast tests. Serve `dist/` over HTTP.
`npm run snapshot` fetches the CoinGecko privacy-coins category and historical
series. The browser automatically refreshes market prices on each page load and
when a page is restored from the back/forward cache. Provider requests bypass the
browser HTTP cache. The snapshot and its timestamps remain visible if a refresh
fails. Manual market and selected-history refreshes are also available.
Click anywhere on a cryptocurrency row to open its project details.
API rate limits and CORS/network failures are surfaced without fabricated data.

Coverage is the provider category, not all privacy coins. Unreviewed assets have
explicitly unknown protocol and goal summaries. Zero/missing cap or supply is
displayed as unreported. Editorial profiles cite project sources and review dates.
Roadmaps are goals; forecast values are conditional editorial assumptions.

Privacy scores are ordinal editorial assessments with source links and rationales.
15 covered assets have ratings; others explicitly show Not rated. They are not audits,
anonymity probabilities, or investment ratings. Chart samples exclude intraday data.
Vendor maximum
supply does not establish a hard protocol cap. No audited unlock calendar, fee
feed, revenue, or staking APY is provided. Browser and WebMCP execution have not
been validated; syntax, source paths and numerical tests are checked locally.
