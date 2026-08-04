"use strict";

/**
 * Public, read-only frontend configuration.
 *
 * SAFE:
 * - Supabase project URL
 * - Supabase anon/public key
 *
 * NEVER PLACE HERE:
 * - service_role key
 * - Railway secrets
 * - ingest secrets
 * - wallet/private keys
 */

window.ASCEND_CONFIG = Object.freeze({
  supabaseUrl: "https://itpflhyqlddzyzhfintw.supabase.co",
  supabaseAnonKey: "sb_publishable_kH6M9rddjhZDqbWDJv2CBg_GN1kFkrg",

  refreshIntervalMs: 60_000,

  paperOnly: true,
  liveTradingEnabled: false,
});
