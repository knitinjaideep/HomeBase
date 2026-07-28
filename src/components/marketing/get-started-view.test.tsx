import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { GetStartedView } from "./get-started-view";

function render() {
  return renderToStaticMarkup(<GetStartedView />);
}

describe("GetStartedView", () => {
  it("shows both path options via the reused PR 2 cards", () => {
    const html = render();
    expect(html).toContain('value="buying"');
    expect(html).toContain('value="owning"');
    expect(html).toContain("I’m buying a home");
    expect(html).toContain("I own a home");
  });

  it("offers a way back to the welcome page and directly to login", () => {
    const html = render();
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/login"');
    expect(html).toContain("Already have an account? Log in");
  });

  it("starts with Continue disabled until a path is chosen", () => {
    const html = render();
    expect(html).toMatch(/<button[^>]*disabled[^>]*>\s*Continue/);
  });
});
