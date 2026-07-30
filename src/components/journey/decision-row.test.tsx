import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { GuideDecision } from "@/lib/guide";
import { buyerCopy } from "@/lib/journey/buyer-copy";
import { DecisionRow } from "./decision-row";

const decision: GuideDecision = {
  id: "strategy.some-decision",
  prompt: "What are our must-haves?",
};

function render(arrangement: "solo" | "partner" | "group") {
  return renderToStaticMarkup(
    <DecisionRow
      decision={decision}
      stageId="strategy"
      record={undefined}
      buyer1Name="Alex"
      buyer2Name="Sam"
      copy={buyerCopy({
        id: "b1",
        createdAt: "2026-07-28T00:00:00.000Z",
        updatedAt: "2026-07-28T00:00:00.000Z",
        experience: "first-time",
        arrangement,
        targetPurchaseDate: null,
        participantNames: [],
        onboardingCompletedAt: null,
      })}
    />,
  );
}

describe("DecisionRow", () => {
  it("uses 'My decision…' for a solo buyer", () => {
    expect(render("solo")).toContain("My decision…");
  });

  it("uses 'Our decision…' for a partner buyer", () => {
    expect(render("partner")).toContain("Our decision…");
  });

  it("uses \"The buying group's decision…\" for a group buyer", () => {
    expect(render("group")).toContain("The buying group&#x27;s decision…");
  });

  it("keeps sign-off labels tied to the real buyer names regardless of arrangement", () => {
    const decisionWithSignOff: GuideDecision = { ...decision, requiresBothSpouses: true };
    const html = renderToStaticMarkup(
      <DecisionRow
        decision={decisionWithSignOff}
        stageId="strategy"
        record={undefined}
        buyer1Name="Alex"
        buyer2Name="Sam"
        copy={buyerCopy({
          id: "b1",
          createdAt: "2026-07-28T00:00:00.000Z",
          updatedAt: "2026-07-28T00:00:00.000Z",
          experience: "first-time",
          arrangement: "group",
          targetPurchaseDate: null,
          participantNames: [],
          onboardingCompletedAt: null,
        })}
      />,
    );
    expect(html).toContain("Alex approves");
    expect(html).toContain("Sam approves");
  });
});
