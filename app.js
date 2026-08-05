"use strict";

/**
 * ASCEND Headquarters UI
 * Public read-only operational controller.
 *
 * No wallet access.
 * No database writes.
 * No live trading.
 */

const ASCEND_STATE = Object.freeze({
  completion: 95,
  executionMode: "Paper only",
  liveTradingEnabled: false,
});

let refreshTimeoutId = null;

function updateClock() {
  const clock = document.getElementById("clock");

  if (!clock) {
    return;
  }

  clock.textContent = new Date().toLocaleTimeString("en-GB", {
    hour12: false,
  });
}

function initializeRoomSelection() {
  const rooms = document.querySelectorAll(".room");

  rooms.forEach((room) => {
    room.addEventListener("click", () => {
      rooms.forEach((item) => {
        item.classList.remove("active");
      });

      room.classList.add("active");
    });
  });
}

function enforcePaperOnlyMode() {
  document.documentElement.dataset.executionMode =
    ASCEND_STATE.executionMode;

  if (ASCEND_STATE.liveTradingEnabled) {
    throw new Error(
      "[ASCEND SECURITY] Live trading must remain disabled.",
    );
  }
}

function findMetric(label) {
  const normalizedLabel = label.trim().toLowerCase();

  return [...document.querySelectorAll(".metric")].find((metric) => {
    const metricLabel = metric.querySelector("span");

    return (
      metricLabel?.textContent.trim().toLowerCase() === normalizedLabel
    );
  });
}

function updateMetricValue(label, value) {
  const metric = findMetric(label);
  const valueElement = metric?.querySelector("strong");

  if (valueElement) {
    valueElement.textContent = value;
  }
}

function updateMetricDescription(label, description) {
  const metric = findMetric(label);
  const descriptionElement = metric?.querySelector("small");

  if (descriptionElement) {
    descriptionElement.textContent = description;
  }
}

function formatNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return number.toLocaleString("en-US");
}

function formatTimestamp(value) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "UTC",
  });
}

function getPublicConfig() {
  const config = window.ASCEND_CONFIG;

  if (!config?.supabaseUrl) {
    throw new Error("Supabase project URL is missing.");
  }

  if (!config?.supabaseAnonKey) {
    throw new Error("Supabase publishable key is missing.");
  }

  if (!config.paperOnly || config.liveTradingEnabled) {
    throw new Error("Unsafe ASCEND frontend configuration detected.");
  }

  return config;
}

async function fetchAscendStatus() {
  const config = getPublicConfig();

  const endpoint = new URL(
    `${config.supabaseUrl.replace(/\/+$/, "")}/rest/v1/ascend_ui_status`,
  );

  endpoint.searchParams.set(
    "select",
    [
      "solana_tokens",
      "newest_solana_token",
      "solana_snapshots_last_hour",
      "latest_solana_snapshot",
      "active_chains",
      "completion_percent",
      "paper_only",
    ].join(","),
  );

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 10_000);

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
      const errorBody = await response.text();

      throw new Error(
        `Supabase returned ${response.status}: ${errorBody}`,
      );
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

function renderAscendStatus(status) {
  const tokenCount = document.getElementById("solana-token-count");

  if (tokenCount) {
    tokenCount.textContent = formatNumber(status.solana_tokens);
  }

  updateMetricValue(
    "Active chains",
    formatNumber(status.active_chains),
  );

  updateMetricDescription(
    "Solana tokens observed",
    `Live PumpPortal · ${formatNumber(
      status.solana_snapshots_last_hour,
    )} snapshots last hour`,
  );

  const completionElement = document.querySelector(
    ".sidebar-footer strong",
  );

  if (completionElement && status.completion_percent !== undefined) {
    completionElement.textContent =
      `${formatNumber(status.completion_percent)}%`;
  }

  const modeBadge = document.querySelector(".mode-badge");

  if (modeBadge) {
    modeBadge.textContent =
      status.paper_only === true
        ? "Paper Research Mode"
        : "Unsafe Execution State";
  }

  document.documentElement.dataset.dataState = "online";
  document.documentElement.dataset.lastRefresh =
    new Date().toISOString();

  const latestToken = formatTimestamp(status.newest_solana_token);
  const latestSnapshot = formatTimestamp(status.latest_solana_snapshot);

  console.log("[ASCEND] Live status synchronized", {
    solanaTokens: status.solana_tokens,
    newestSolanaTokenUtc: latestToken,
    snapshotsLastHour: status.solana_snapshots_last_hour,
    latestSnapshotUtc: latestSnapshot,
    activeChains: status.active_chains,
    paperOnly: status.paper_only,
  });
}

async function loadAscendStatus() {
  try {
    const status = await fetchAscendStatus();
    renderAscendStatus(status);
  } catch (error) {
    document.documentElement.dataset.dataState = "error";

    console.error(
      "[ASCEND] Live status synchronization failed:",
      error,
    );
  }
}

function scheduleStatusRefresh() {
  window.clearTimeout(refreshTimeoutId);

  const refreshInterval =
    window.ASCEND_CONFIG?.refreshIntervalMs ?? 60_000;

  refreshTimeoutId = window.setTimeout(async () => {
    await loadAscendStatus();
    scheduleStatusRefresh();
  }, refreshInterval);
}

async function initializeHeadquarters() {
  updateClock();
  initializeRoomSelection();
  enforcePaperOnlyMode();

  window.setInterval(updateClock, 1000);

  await loadAscendStatus();
  scheduleStatusRefresh();

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      loadAscendStatus();
    }
  });

  console.log(
    `[ASCEND] Headquarters initialized — completion ${ASCEND_STATE.completion}% — paper only`,
  );
}

document.addEventListener(
  "DOMContentLoaded",
  initializeHeadquarters,
);
