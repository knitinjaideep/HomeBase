import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PublicWelcomePage } from "./public-welcome-page";

function render() {
  return renderToStaticMarkup(<PublicWelcomePage />);
}

describe("PublicWelcomePage", () => {
  it("shows exactly one H1 with the welcome headline", () => {
    const html = render();
    const h1s = html.match(/<h1[^>]*>/g) ?? [];
    expect(h1s).toHaveLength(1);
    expect(html).toContain("From finding a home to caring for it.");
  });

  it("offers Log in and Get started, and nothing else as primary actions", () => {
    const html = render();
    expect(html).toContain('href="/login"');
    expect(html).toContain('href="/get-started"');
    expect(html).toContain("Log in");
    expect(html).toContain("Get started");
  });

  it("never shows the buyer/homeowner path choices on the root page", () => {
    const html = render();
    expect(html).not.toContain("I’m buying a home");
    expect(html).not.toContain("I own a home");
  });

  it("shows no authenticated app chrome", () => {
    const html = render();
    for (const term of ["Journey", "Homes", "Toolkit", "Settings", "Sign out"]) {
      expect(html).not.toContain(term);
    }
  });

  it("uses semantic header, main, and footer landmarks", () => {
    const html = render();
    expect(html).toContain("<header");
    expect(html).toContain("<main");
    expect(html).toContain("<footer");
  });
});
