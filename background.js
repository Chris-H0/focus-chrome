import { getValidRules, isHttpUrl, isRuleActive, urlMatchesRule } from "./shared.js";

const REDIRECT_URL = "https://www.google.com/";
chrome.webNavigation.onCommitted.addListener((details) => {
  void handleNavigation(details);
});

chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  void handleNavigation(details);
});

async function handleNavigation(details) {
  if (details.frameId !== 0) {
    return;
  }

  if (!isHttpUrl(details.url) || details.url === REDIRECT_URL) {
    return;
  }

  try {
    const rules = await getValidRules();
    const blockedRule = rules.find((rule) => isRuleActive(rule) && urlMatchesRule(details.url, rule));

    if (!blockedRule) {
      return;
    }

    await chrome.tabs.update(details.tabId, { url: REDIRECT_URL });
  } catch (error) {
    console.error("Unable to block navigation.", error);
  }
}
