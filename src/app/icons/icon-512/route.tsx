import { ImageResponse } from "next/og";

export const runtime = "edge";

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
        <div style={{ color: "#f9f8f5", fontSize: 288, fontWeight: 700, fontFamily: "sans-serif" }}>H</div>
      </div>
    ),
    { width: 512, height: 512 },
  );
}
