import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
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

  it("has a matching CSS rule in globals.css for its class name", () => {
    // Guards the one cross-file link this component has: renderToStaticMarkup
    // above only proves the class NAME is applied to the div, not that a
    // matching CSS rule still exists — this would catch a typo or rename in
    // either file silently breaking the backdrop.
    const globalsCssPath = fileURLToPath(
      new URL("../app/globals.css", import.meta.url),
    );
    const css = readFileSync(globalsCssPath, "utf8");
    expect(css).toContain(".hs-app-backdrop {");
  });
});
