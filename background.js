import { domainToRegex, getValidRules, isRuleActive } from "./shared.js";

const ALARM_NAME = "refresh-blocking-rules";
const REDIRECT_URL = "https://www.google.com/";

chrome.runtime.onInstalled.addListener(() => {
  void initialize();
});

chrome.runtime.onStartup.addListener(() => {
  void initialize();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    void refreshBlockingRules();
  }
});

void initialize();

async function initialize() {
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 });
  await refreshBlockingRules();
}

async function refreshBlockingRules() {
  try {
    const rules = await getValidRules();
    const activeRules = rules.filter((rule) => isRuleActive(rule));
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
          regexFilter: domainToRegex(rule.domain),
          resourceTypes: ["main_frame"]
        }
      }))
    });
  } catch (error) {
    console.error("Unable to refresh blocking rules.", error);
  }
}
