import { formatDays, getValidRules, isRuleActive } from "./shared.js";

const container = document.getElementById("rules");

void renderRules();

async function renderRules() {
  try {
    const rules = await getValidRules();

    if (rules.length === 0) {
      container.innerHTML = '<p class="empty-state">No valid rules found in <code>rules.json</code>.</p>';
      return;
    }

    container.replaceChildren(
      ...rules.map((rule) => createRuleCard(rule))
    );
  } catch (error) {
    console.error("Unable to render rules.", error);
    container.innerHTML = '<p class="empty-state">Unable to load <code>rules.json</code>.</p>';
  }
}

function createRuleCard(rule) {
  const article = document.createElement("article");
  article.className = "rule-card";
  const active = isRuleActive(rule);

  const title = document.createElement("h2");
  title.textContent = rule.domain;

  const time = document.createElement("p");
  time.className = "rule-card__time";
  time.textContent = `${rule.start}-${rule.end}`;

  const days = document.createElement("p");
  days.className = "rule-card__days";
  days.textContent = formatDays(rule.days);

  const status = document.createElement("p");
  status.className = `rule-card__status ${active ? "rule-card__status--active" : "rule-card__status--inactive"}`;
  status.textContent = active ? "Blocking now" : "Not blocking now";

  article.append(title, time, days, status);
  return article;
}
