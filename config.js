"use strict";

/**
 * Public, read-only frontend configuration.
 *
 * Put your Supabase Project URL and publishable key below.
 *
 * SAFE:
 * - https://YOUR_PROJECT_REF.supabase.co
 * - sb_publishable_...
 *
 * NEVER USE:
 * - service_role
 * - sb_secret_...
 * - Railway secrets
 * - ingest secrets
 * - wallet/private keys
 */
window.ASCEND_CONFIG = Object.freeze({
  supabaseUrl: "",
  supabaseAnonKey: "",
  refreshIntervalMs: 60000,
  paperOnly: true,
  liveTradingEnabled: false,
});
