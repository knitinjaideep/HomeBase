import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { GuideAction } from "@/lib/guide";
import { ActionRow } from "./action-row";

const action: GuideAction = {
  id: "strategy.understand-process",
  title: "Understand how this whole process works, end to end",
  why: "Knowing what's coming makes every later decision calmer.",
  defaultOwner: "both",
  weight: 2,
};

describe("ActionRow", () => {
  it("opens the detail area and shows a 'Start here' chip when emphasized", () => {
    const html = renderToStaticMarkup(
      <ActionRow action={action} stageId="strategy" state={undefined} emphasize />,
    );
    expect(html).toContain("Start here");
    // Detail-area-only content proves it rendered open by default.
    expect(html).toContain("Attachment reference");
  });

  it("stays collapsed with no chip when not emphasized", () => {
    const html = renderToStaticMarkup(
      <ActionRow action={action} stageId="strategy" state={undefined} />,
    );
    expect(html).not.toContain("Start here");
    expect(html).not.toContain("Attachment reference");
  });

  it("shows the quick-skip affordance only while not started", () => {
    const notStarted = renderToStaticMarkup(
      <ActionRow
        action={action}
        stageId="strategy"
        state={undefined}
        quickSkipLabel="Not applicable — I've done this before"
      />,
    );
    expect(notStarted).toContain("Not applicable");

    const inProgress = renderToStaticMarkup(
      <ActionRow
        action={action}
        stageId="strategy"
        state={{
          id: action.id,
          createdAt: "2026-07-28T00:00:00.000Z",
          updatedAt: "2026-07-28T00:00:00.000Z",
          stageId: "strategy",
          status: "in-progress",
          owner: "both",
          dueDate: null,
          notes: "",
          attachmentNote: "",
          completedAt: null,
        }}
        quickSkipLabel="Not applicable — I've done this before"
      />,
    );
    expect(inProgress).not.toContain("Not applicable");
  });
});
