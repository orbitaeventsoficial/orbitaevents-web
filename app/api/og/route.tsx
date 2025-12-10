// app/api/og/route.tsx
import { ImageResponse } from "next/og";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || "Òrbita Events";

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, var(--bg-main), var(--bg-surface))",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontFamily: "Space Grotesk",
          position: "relative",
        }}
      >
        <div style={{ 
          position: "absolute", 
          inset: 0, 
          background: "radial-gradient(circle at 50% 50%, rgba(215,184,110,.2), transparent 70%)",
          filter: "blur(100px)"
        }} />
        <h1 style={{ fontSize: 80, fontWeight: 900, background: "linear-gradient(to right, white, var(--oe-gold), white)", backgroundClip: "text", color: "transparent" }}>
          {title}
        </h1>
        <p style={{ fontSize: 32, opacity: 0.8 }}>DJ Bodas Premium Barcelona</p>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

