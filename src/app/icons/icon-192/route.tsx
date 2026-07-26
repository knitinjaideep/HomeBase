import { ImageResponse } from "next/og";

export const runtime = "edge";

/** The app's monogram icon, generated at request time — no image asset to source or keep in sync. */
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
        <div style={{ color: "#f9f8f5", fontSize: 108, fontWeight: 700, fontFamily: "sans-serif" }}>H</div>
      </div>
    ),
    { width: 192, height: 192 },
  );
}
