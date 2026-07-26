import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS ignores alpha on this one, so the background is deliberately solid. */
export default function AppleIcon() {
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
        <div style={{ color: "#f9f8f5", fontSize: 100, fontWeight: 700, fontFamily: "sans-serif" }}>H</div>
      </div>
    ),
    { ...size },
  );
}
