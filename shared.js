const DAY_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export async function loadRulesFile() {
  const response = await fetch(chrome.runtime.getURL("rules.json"));

  if (!response.ok) {
    throw new Error(`Unable to load rules.json (${response.status})`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function getValidRules() {
  const rawRules = await loadRulesFile();

  return rawRules
    .map(normalizeRule)
    .filter((rule) => rule !== null);
}

export function normalizeRule(rawRule) {
  if (!rawRule || typeof rawRule !== "object") {
    return null;
  }

  const domain = normalizeDomain(rawRule.domain);
  const days = normalizeDays(rawRule.days);
  const startMinutes = parseTime(rawRule.start);
  const endMinutes = parseTime(rawRule.end);

  if (!domain || days.length === 0 || startMinutes === null || endMinutes === null) {
    return null;
  }

  return {
    domain,
    days,
    start: rawRule.start,
    end: rawRule.end,
    startMinutes,
    endMinutes
  };
}

export function isRuleActive(rule, now = new Date()) {
  if (!rule.days.includes(DAY_NAMES[now.getDay()])) {
    return false;
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (rule.startMinutes === rule.endMinutes) {
    return false;
  }

  if (rule.startMinutes < rule.endMinutes) {
    return currentMinutes >= rule.startMinutes && currentMinutes < rule.endMinutes;
  }

  return currentMinutes >= rule.startMinutes || currentMinutes < rule.endMinutes;
}

export function isHttpUrl(url) {
  return typeof url === "string" && (url.startsWith("http://") || url.startsWith("https://"));
}

export function urlMatchesRule(url, rule) {
  const hostname = getNormalizedHostname(url);

  if (!hostname) {
    return false;
  }

  return hostname === rule.domain || hostname.endsWith(`.${rule.domain}`);
}

export function formatDays(days) {
  return days
    .map((day) => day.charAt(0).toUpperCase() + day.slice(1))
    .join(", ");
}

function normalizeDomain(value) {
  if (typeof value !== "string") {
    return null;
  }

  let domain = value.trim().toLowerCase();

  if (domain.startsWith("http://") || domain.startsWith("https://")) {
    try {
      domain = new URL(domain).hostname;
    } catch {
      return null;
    }
  }

  domain = domain
    .split(/[/?#]/, 1)[0]
    .replace(/:\d+$/, "")
    .replace(/^\.+|\.+$/g, "")
    .replace(/^www\./, "");

  if (!domain || domain.includes(" ")) {
    return null;
  }

  return domain;
}

function getNormalizedHostname(url) {
  if (!isHttpUrl(url)) {
    return null;
  }

  try {
    return normalizeDomain(new URL(url).hostname);
  } catch {
    return null;
  }
}

function normalizeDays(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const validDays = value
    .filter((day) => typeof day === "string")
    .map((day) => day.trim().toLowerCase())
    .filter((day) => DAY_NAMES.includes(day));

  return [...new Set(validDays)];
}

function parseTime(value) {
  if (typeof value !== "string") {
    return null;
  }

  const match = value.match(TIME_PATTERN);

  if (!match) {
    return null;
  }

  return Number(match[1]) * 60 + Number(match[2]);
}
