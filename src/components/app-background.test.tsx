import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AppBackground } from "./app-background";

describe("AppBackground", () => {
  it("renders a decorative, non-interactive backdrop", () => {
    const html = renderToStaticMarkup(<AppBackground />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("hs-app-backdrop");
  });

  it("renders no text content", () => {
    const html = renderToStaticMarkup(<AppBackground />);
    expect(html.replace(/<[^>]*>/g, "").trim()).toBe("");
  });
});
