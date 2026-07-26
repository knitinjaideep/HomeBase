import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 6,
        }}
      >
        <div style={{ color: "#f9f8f5", fontSize: 20, fontWeight: 700, fontFamily: "sans-serif" }}>H</div>
      </div>
    ),
    { ...size },
  );
}
