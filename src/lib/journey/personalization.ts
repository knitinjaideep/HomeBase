import type { GuideStage } from "@/lib/guide";
import { money, monthLabel, num } from "@/lib/format";
import { evaluateCondition } from "./criteria";
import { primaryDeal } from "./criteria";
import type { JourneySnapshot } from "./snapshot";

/**
 * Turns a stage's personalization rules into concrete sentences for this
 * household, filling `{{token}}` placeholders from stored data. Rules whose
 * `when` clause is false are dropped entirely.
 */
export function personalizedLines(stage: GuideStage, s: JourneySnapshot): string[] {
  const tokens = buildTokens(s);
  return stage.personalization
    .filter((rule) => evaluateCondition(rule.when, s))
    .map((rule) => fillTokens(rule.text, tokens));
}

function fillTokens(text: string, tokens: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => tokens[key] ?? "—");
}

function buildTokens(s: JourneySnapshot): Record<string, string> {
  const f = s.financial;
  const h = s.household;
  const primary = s.towns.filter((t) => t.designation === "primary").map((t) => t.name);
  const deal = primaryDeal(s);

  const b1 = h.buyer1CreditScore;
  const b2 = h.buyer2CreditScore;
  const creditGap = b1 != null && b2 != null ? Math.abs(b1 - b2) : null;

  return {
    purchaseWindow: `${monthLabel(h.idealPurchaseStart)}–${monthLabel(h.idealPurchaseEnd)}`,
    offerWindow: offerWindow(h.idealPurchaseStart),
    minOwnershipYears: num(h.minOwnershipYears),
    minReserve: money(f.minReserve),
    preferredReserve: money(f.preferredReserve),
    taxableInvestments: money(f.taxableInvestments),
    comfortableRange: `${money(f.priceComfortableMin)}–${money(f.priceComfortableMax)}`,
    routineCeiling: money(f.priceRoutineCeiling),
    walkAwayPrice: money(f.priceAbsoluteCeiling),
    maxCommute: `${num(s.preferences.maxCommuteMinutes)} min`,
    primaryTowns: primary.length ? primary.join(", ") : "not yet chosen",
    lenderCount: num(distinctLenderCount(s)),
    creditScoreGap: creditGap != null ? num(creditGap) : "—",
    missingRoles: missingRoleLabels(s),
    dealWalkAwayPrice: money(deal?.deal.walkAwayPrice ?? null),
  };
}

/** Offers usually precede closing by 4–8 weeks; express that as a month range. */
function offerWindow(purchaseStart: string): string {
  const [y, m] = purchaseStart.split("-").map(Number);
  if (!y || !m) return "a couple of months earlier";
  const start = new Date(y, m - 2, 1);
  const end = new Date(y, m - 1, 1);
  return `${start.toLocaleDateString("en-US", { month: "long" })}–${end.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })}`;
}

function distinctLenderCount(s: JourneySnapshot): number {
  const names = new Set<string>();
  s.lenderQuotes.forEach((q) => names.add(q.lender.trim().toLowerCase()));
  s.approvals.forEach((a) => names.add(a.lender.trim().toLowerCase()));
  s.professionals.filter((p) => p.role === "lender").forEach((p) => names.add(p.name.trim().toLowerCase()));
  names.delete("");
  return names.size;
}

function missingRoleLabels(s: JourneySnapshot): string {
  const need: { role: string; label: string }[] = [
    { role: "buyer-agent", label: "buyer's agent" },
    { role: "attorney", label: "attorney" },
    { role: "home-inspector", label: "home inspector" },
    { role: "insurance-agent", label: "insurance agent" },
  ];
  const missing = need
    .filter((n) => !s.professionals.some((p) => p.role === n.role && p.selectionStatus === "selected"))
    .map((n) => n.label);
  return missing.length ? missing.join(", ") : "none";
}
