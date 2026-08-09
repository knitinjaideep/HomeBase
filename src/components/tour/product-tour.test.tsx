import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ProductTourOverlay } from "./product-tour";

describe("ProductTourOverlay", () => {
  it("renders nothing when closed", () => {
    const html = renderToStaticMarkup(
      <ProductTourOverlay open={false} onClose={() => {}} mode="buying" />,
    );
    expect(html).toBe("");
  });

  it("opens on the first buyer-specific step, with a skip action", () => {
    const html = renderToStaticMarkup(
      <ProductTourOverlay open onClose={() => {}} mode="buying" />,
    );
    expect(html).toContain("set up as a buyer");
    expect(html).toContain("Skip");
  });

  it("opens on the first owner-specific step", () => {
    const html = renderToStaticMarkup(
      <ProductTourOverlay open onClose={() => {}} mode="owning" />,
    );
    expect(html).toContain("set up as a homeowner");
  });

  it("shows one progress dot per step", () => {
    const html = renderToStaticMarkup(
      <ProductTourOverlay open onClose={() => {}} mode="buying" />,
    );
    const dots = html.match(/aria-current="(true|false)"/g) ?? [];
    expect(dots).toHaveLength(6);
  });
});
