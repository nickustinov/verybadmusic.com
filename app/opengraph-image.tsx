import { ImageResponse } from "next/og";

import { SITE_NAME } from "@/lib/site";

export const alt = `${SITE_NAME} — stream DJ sets and mixes`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#fafafa",
          padding: "80px",
          backgroundImage:
            "repeating-linear-gradient(45deg, transparent, transparent 11px, rgba(255,255,255,0.04) 11px, rgba(255,255,255,0.04) 12px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 96, fontWeight: 700, letterSpacing: "-2px" }}>
          {SITE_NAME}
          <span style={{ marginLeft: 8, color: "#fafafa" }}>_</span>
        </div>
        <div style={{ marginTop: 24, fontSize: 36, color: "#a1a1a1" }}>
          dj sets · mixes · streamed
        </div>
      </div>
    ),
    size,
  );
}
