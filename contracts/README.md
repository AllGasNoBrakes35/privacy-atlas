# Privacy Atlas — Esmeralda testnet contract

**Status: deployed on Esmeralda testnet.** The publisher supplied accepted wallet receipts for template publication and component creation. See [deployment details](artifacts/deployment.json) for the exact addresses, transaction IDs and immutable research URL. The dashboard verifies saved research bytes against the recorded fingerprint without requiring a wallet. It does not perform a live indexer query.

## What this contract does

`PrivacyAtlasSnapshot` records the SHA-256 digest and HTTPS location of one saved
research edition. It has two public read methods, `digest()` and `research_url()`.
It has no mutation methods and no component owner. Each edition needs a new
component. The saved edition covers the 53 assets in the bundled market snapshot,
including available privacy assessments and 1-, 3- and 5-year forecast scenarios.

A digest commitment proves that the downloaded bytes match the recorded edition.
It does not prove accuracy, investment merit, price freshness or future returns.
Anyone may instantiate the template; only a specifically identified component
should be treated as the application's published edition. Prices refreshed in a
reader's browser are separate from the saved edition.

## Publish from your Ootle wallet

1. Run the official Ootle wallet on **Esmeralda**, authenticate with its passkey
   flow, create an account and claim faucet test tokens.
2. Choose **Publish Template**, select the funded account, and upload
   [`artifacts/privacy_atlas_snapshot.wasm`](artifacts/privacy_atlas_snapshot.wasm).
   Estimate the fee and publish. Wait for a confirmed result and save the actual
   template address and transaction ID.
3. Instantiate the published template by calling `new` with the two string
   arguments under `constructor.arguments` in
   [`artifacts/deployment.json`](artifacts/deployment.json). This is a second
   transaction, creating the immutable snapshot component. Record its confirmed
   component address. Publishing the template alone does not create a record.
4. Read the component's `digest()` and `research_url()` and compare them with
   the supplied artifact. Keep the public receipts before marking deployment
   complete. The dashboard can then use that confirmed component address.

Use the official wallet/SDK's function-call facilities for step 3. The deployment
JSON describes the arguments; it is not itself a signed transaction or a file
to upload as a template. No wallet keys or API credentials belong in this repo.

## Build and verify

From the repository root, with Rust and Node.js installed:

```sh
rustup target add wasm32-unknown-unknown
cargo build --manifest-path contracts/Cargo.toml --target wasm32-unknown-unknown --release --locked
cargo test --manifest-path contracts/Cargo.toml --locked
node scripts/prepare-ootle.mjs
```

The prepared WASM was built using Rust 1.98.1 and `tari_template_lib` 0.31.1,
matching the library version used by wallet release 0.40.0. `Cargo.lock` pins
dependencies. Validation tests check digest format. The WASM build succeeds;
component creation was accepted on testnet. The receipt contains the expected digest, URL, owner rule and public read access rules. Public read methods have not been independently called from this environment.

`artifacts/SHA256SUMS` contains checksums of the saved WASM and research bytes. The preparation script refuses to overwrite this deployed edition. New research needs a new edition and component.

## Official references

- [Wallet setup](https://ootle.tari.com/guides/setup-a-wallet/)
- [Publish a WASM template](https://ootle.tari.com/guides/publishing-templates/)
- [Call templates using the Ootle SDK](https://ootle.tari.com/guides/play-the-guessing-game/)
- [Scoped wallet API keys](https://ootle.tari.com/guides/agent-api-keys/)
