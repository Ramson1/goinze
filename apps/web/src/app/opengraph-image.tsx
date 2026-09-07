import { ImageResponse } from "next/og";
import { SITE } from "@/lib/seo";

/* Next.js file-convention OG image: served at /opengraph-image */
export const alt = SITE.name;
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
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #172554 0%, #1e40af 60%, #2563eb 100%)",
          padding: "70px 80px",
          color: "#ffffff",
          position: "relative",
        }}
      >
        {/* Red accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: 14,
            background: "#dc2626",
            display: "flex",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {/* Monogram */}
          <div
            style={{
              width: 110,
              height: 110,
              borderRadius: 55,
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 64, fontWeight: 800, color: "#1e40af" }}>G</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: 1 }}>
              GOINZE INTERNATIONAL SCHOOL
            </span>
            <span style={{ fontSize: 22, color: "#bfdbfe" }}>
              of Medical Health Science and Technology
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <span style={{ fontSize: 46, fontWeight: 800, lineHeight: 1.2 }}>
            NBTE-Licensed Health Science College in Abuja
          </span>
          <span style={{ fontSize: 26, color: "#dbeafe" }}>
            ND Programmes: Community Health • Public Health • Pharmacy Technician • Medical
            Laboratory Technician
          </span>
          <span style={{ fontSize: 24, fontStyle: "italic", color: "#fca5a5" }}>
            &ldquo;{SITE.motto}&rdquo;
          </span>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            color: "#bfdbfe",
          }}
        >
          <span>Bwari Area Council, Abuja, Nigeria</span>
          <span style={{ fontWeight: 700, color: "#ffffff" }}>goinzeschool.edu.ng</span>
        </div>
      </div>
    ),
    size,
  );
}
