"use client";

// Last-resort error screen when the root layout itself fails.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100dvh", display: "grid", placeItems: "center", background: "#0e0c0a", color: "#ebe1cf", fontFamily: "system-ui, sans-serif", textAlign: "center", padding: 24 }}>
        <div>
          <p style={{ fontSize: 28, letterSpacing: "0.14em", marginBottom: 24 }}>JOD-Z</p>
          <p style={{ marginBottom: 20 }}>The shop hit a problem loading. Please try again in a moment.</p>
          <button type="button" onClick={reset} style={{ padding: "12px 24px", borderRadius: 999, border: "1px solid #ebe1cf", background: "transparent", color: "#ebe1cf", cursor: "pointer" }}>Try again</button>
        </div>
      </body>
    </html>
  );
}
