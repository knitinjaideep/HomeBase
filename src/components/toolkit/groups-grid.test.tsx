import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { BUYER_TOOLKIT_GROUPS, OWNER_TOOLKIT_GROUPS } from "@/lib/toolkit/groups";
import { ToolkitGroupsGrid } from "./groups-grid";

/** renderToStaticMarkup HTML-escapes text content (e.g. "&" → "&amp;"), so labels must be escaped the same way before comparing. */
function htmlEscape(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/'/g, "&#x27;");
}

describe("ToolkitGroupsGrid", () => {
  it("renders every buyer group's title and each tool's label", () => {
    const html = renderToStaticMarkup(<ToolkitGroupsGrid groups={BUYER_TOOLKIT_GROUPS} />);
    for (const group of BUYER_TOOLKIT_GROUPS) {
      expect(html).toContain(group.title);
      for (const tool of group.tools) {
        expect(html).toContain(htmlEscape(tool.label));
      }
    }
  });

  it("renders every owner group's title and each tool's label", () => {
    const html = renderToStaticMarkup(<ToolkitGroupsGrid groups={OWNER_TOOLKIT_GROUPS} />);
    for (const group of OWNER_TOOLKIT_GROUPS) {
      expect(html).toContain(group.title);
      for (const tool of group.tools) {
        expect(html).toContain(htmlEscape(tool.label));
      }
    }
  });

  it("uses a responsive grid (stacks on mobile, multi-column from sm: up) rather than a fixed layout", () => {
    const html = renderToStaticMarkup(<ToolkitGroupsGrid groups={BUYER_TOOLKIT_GROUPS} />);
    expect(html).toContain("grid");
    expect(html).toContain("sm:grid-cols-2");
    expect(html).not.toMatch(/width:\s*\d+px/);
  });

  it("renders nothing for an empty group list without crashing", () => {
    const html = renderToStaticMarkup(<ToolkitGroupsGrid groups={[]} />);
    expect(html).not.toContain("undefined");
  });
});
