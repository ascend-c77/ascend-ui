"use strict";

const ASCEND_STATE = Object.freeze({
  completion: 95,
  executionMode: "Paper only",
  liveTradingEnabled: false,
});

const numberFormatter = new Intl.NumberFormat("en-US");
const utcFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "medium",
  timeZone: "UTC",
});

let refreshTimer = null;
let latestStatus = null;

function byId(id) {
  return document.getElementById(id);
}

function setText(id, value) {
  const element = byId(id);
  if (element) element.textContent = value;
}

function formatNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? numberFormatter.format(number) : "—";
}

function formatUtc(value) {
  if (!value) return "Unknown";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : `${utcFormatter.format(date)} UTC`;
}

function formatAge(value) {
  if (!value) return "—";
  const ageMs = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(ageMs)) return "—";
  const seconds = Math.max(0, Math.round(ageMs / 1000));
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m`;
}

function updateClock() {
  setText(
    "clock",
    new Date().toLocaleTimeString("en-GB", { hour12: false }),
  );
}

function getConfig() {
  const config = window.ASCEND_CONFIG;

  if (!config?.supabaseUrl || !config?.supabaseAnonKey) {
    throw new Error(
      "Supabase public configuration is missing. Fill config.js with the project URL and sb_publishable key.",
    );
  }

  if (!config.paperOnly || config.liveTradingEnabled) {
    throw new Error("Unsafe frontend configuration detected.");
  }

  return config;
}

async function fetchStatus() {
  const config = getConfig();
  const endpoint = new URL(
    `${config.supabaseUrl.replace(/\/+$/, "")}/rest/v1/ascend_ui_status`,
  );
  endpoint.searchParams.set("select", "*");

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(endpoint.toString(), {
      method: "GET",
      headers: {
        apikey: config.supabaseAnonKey,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Supabase returned ${response.status}: ${body}`);
    }

    const rows = await response.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error("ASCEND status view returned no rows.");
    }

    return rows[0];
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function renderStatus(status) {
  latestStatus = status;

  const values = {
    "solana-tokens": formatNumber(status.solana_tokens),
    "snapshots-hour": formatNumber(status.solana_snapshots_last_hour),
    "total-tokens": formatNumber(status.total_tokens),
    "pending-jobs": formatNumber(status.pending_snapshot_jobs),

    "metric-total": formatNumber(status.total_tokens),
    "metric-solana": formatNumber(status.solana_tokens),
    "metric-evm": formatNumber(status.evm_tokens),
    "metric-chains": `${formatNumber(status.active_chains)}/${formatNumber(status.configured_chains)}`,
    "metric-pending": formatNumber(status.pending_snapshot_jobs),
    "metric-failed": formatNumber(status.failed_snapshot_jobs),
    "metric-expired": formatNumber(status.expired_snapshot_jobs),
    "metric-age": formatAge(status.generated_at),

    "newest-solana": formatUtc(status.newest_solana_token),
    "latest-snapshot": formatUtc(status.latest_solana_snapshot),
    "generated-at": formatUtc(status.generated_at),
    "completion": `${formatNumber(status.completion_percent)}%`,
    "system-state": status.paper_only ? "CORE SYNCHRONIZED" : "UNSAFE EXECUTION STATE",
    "connection-badge": "LIVE",
    "last-refresh": `LAST SYNC ${new Date().toLocaleTimeString("en-GB", { hour12: false })}`,
  };

  Object.entries(values).forEach(([id, value]) => setText(id, value));

  document.documentElement.dataset.connection = "online";
  document.documentElement.dataset.executionMode = ASCEND_STATE.executionMode;

  window.dispatchEvent(
    new CustomEvent("ascend:status", {
      detail: status,
    }),
  );

  console.log("[ASCEND] Live telemetry synchronized", status);
}

function renderError(error) {
  document.documentElement.dataset.connection = "error";
  setText("system-state", "CONNECTION ERROR");
  setText("connection-badge", "ERROR");
  setText("last-refresh", "LIVE TELEMETRY UNAVAILABLE");
  console.error("[ASCEND] Telemetry synchronization failed:", error);
}

async function loadStatus() {
  try {
    renderStatus(await fetchStatus());
  } catch (error) {
    renderError(error);
  }
}

function scheduleRefresh() {
  window.clearTimeout(refreshTimer);
  const interval = window.ASCEND_CONFIG?.refreshIntervalMs ?? 60000;

  refreshTimer = window.setTimeout(async () => {
    await loadStatus();
    scheduleRefresh();
  }, interval);
}

function buildSignalBars() {
  document.querySelectorAll(".signal-bars").forEach((container, groupIndex) => {
    if (container.children.length) return;

    for (let index = 0; index < 14; index += 1) {
      const bar = document.createElement("span");
      const height = 6 + ((index * 13 + groupIndex * 7) % 24);
      bar.style.height = `${height}px`;
      bar.style.animationDelay = `${(index * 0.07).toFixed(2)}s`;
      container.appendChild(bar);
    }
  });
}

async function initialize() {
  updateClock();
  buildSignalBars();
  window.setInterval(updateClock, 1000);

  await loadStatus();
  scheduleRefresh();

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) loadStatus();
  });

  window.addEventListener("online", loadStatus);

  console.log(
    `[ASCEND] Neural Command Center initialized — completion ${ASCEND_STATE.completion}% — paper only`,
  );
}

document.addEventListener("DOMContentLoaded", initialize);
