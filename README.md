# ASCEND Neural Command Center

A complete static rebuild of the ASCEND public dashboard.

## Included

- `index.html` — unified command-center layout
- `styles.css` — cinematic holographic interface
- `app.js` — read-only Supabase telemetry controller
- `hologram.js` — animated neural particle core
- `config.js` — public frontend configuration
- `favicon.svg` — browser icon

## Connect Supabase

Open `config.js` and fill:

```js
supabaseUrl: "https://YOUR_PROJECT_REF.supabase.co",
supabaseAnonKey: "sb_publishable_YOUR_KEY",
```

Only use the public publishable key.

Never use:

- service-role keys
- `sb_secret_...`
- Railway secrets
- ingest secrets
- wallet/private keys

## Required read-only endpoint

The UI expects:

```text
/rest/v1/ascend_ui_status?select=*
```

The view should expose these columns:

- `solana_tokens`
- `newest_solana_token`
- `solana_snapshots_last_hour`
- `latest_solana_snapshot`
- `active_chains`
- `completion_percent`
- `paper_only`
- `total_tokens`
- `evm_tokens`
- `newest_token`
- `pending_snapshot_jobs`
- `processing_snapshot_jobs`
- `failed_snapshot_jobs`
- `expired_snapshot_jobs`
- `configured_chains`
- `generated_at`

## Deployment

For GitHub Pages:

1. Replace the old repository files with these files.
2. Put your public Supabase values in `config.js`.
3. Commit to the branch used by GitHub Pages.
4. Wait for deployment, then hard refresh with `Ctrl + F5`.

This frontend performs no writes, connects to no wallet, and contains no live-trading logic.
