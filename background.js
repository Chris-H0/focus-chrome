import { getActiveRules, getNextRuleBoundary, getValidRules, isHttpUrl, isRuleActive, urlMatchesRule } from "./shared.js";

const ALARM_NAME = "refresh-blocking-rules";
const REDIRECT_URL = "https://www.google.com/";
let cachedRules = null;
let initializePromise = null;
let syncPromise = null;

chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  void handleSpaNavigation(details);
});

chrome.runtime.onInstalled.addListener(() => {
  void initialize();
});

chrome.runtime.onStartup.addListener(() => {
  void initialize();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    void syncBlockingState();
  }
});

void initialize();

async function initialize() {
  if (!initializePromise) {
    initializePromise = initializeInner();
  }

  await initializePromise;
}

async function initializeInner() {
  cachedRules = await getValidRules();
  await syncBlockingState();
}

async function syncBlockingState() {
  if (syncPromise) {
    return syncPromise;
  }

  syncPromise = syncBlockingStateInner();

  try {
    await syncPromise;
  } finally {
    syncPromise = null;
  }
}

async function syncBlockingStateInner() {
  const rules = cachedRules ?? [];
  const activeRules = getActiveRules(rules)
    .slice()
    .sort((left, right) => left.domain.localeCompare(right.domain));
  const existingRules = await chrome.declarativeNetRequest.getSessionRules();

  await chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: existingRules.map((rule) => rule.id),
    addRules: activeRules.map((rule, index) => ({
      id: index + 1,
      priority: 1,
      action: {
        type: "redirect",
        redirect: {
          url: REDIRECT_URL
        }
      },
      condition: {
        requestDomains: [rule.domain],
        resourceTypes: ["main_frame"]
      }
    }))
  });

  await scheduleNextRefresh(rules);
}

async function scheduleNextRefresh(rules) {
  await chrome.alarms.clear(ALARM_NAME);

  const nextBoundary = getNextRuleBoundary(rules);

  if (!nextBoundary) {
    return;
  }

  chrome.alarms.create(ALARM_NAME, {
    when: Math.max(nextBoundary.getTime(), Date.now() + 1000)
  });
}

async function handleSpaNavigation(details) {
  if (details.frameId !== 0) {
    return;
  }

  if (!isHttpUrl(details.url) || details.url === REDIRECT_URL) {
    return;
  }

  try {
    await initialize();
    const rules = cachedRules ?? [];
    const blockedRule = rules.find((rule) => isRuleActive(rule) && urlMatchesRule(details.url, rule));

    if (!blockedRule) {
      return;
    }

    await chrome.tabs.update(details.tabId, { url: REDIRECT_URL });
  } catch (error) {
    console.error("Unable to block SPA navigation.", error);
  }
}
