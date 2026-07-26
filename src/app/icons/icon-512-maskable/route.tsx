import { ImageResponse } from "next/og";

export const runtime = "edge";

/**
 * Maskable variant: the OS applies its own shape mask (circle, squircle,
 * rounded square, …) over this full-bleed image, so the glyph is kept well
 * inside the safe zone (~80% of the canvas) to survive aggressive masking.
 */
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#296860",
        }}
      >
        <div style={{ color: "#f9f8f5", fontSize: 200, fontWeight: 700, fontFamily: "sans-serif" }}>H</div>
      </div>
    ),
    { width: 512, height: 512 },
  );
}
