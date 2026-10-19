"use client";
import { useEffect } from "react";
import { Button } from "@/components/Button";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <main className="page">
      <div className="wrap legal">
        <p className="label gold">Something went wrong</p>
        <h1 className="serif page-title">Bit of a <em>stumble.</em></h1>
        <p className="lede">This page did not load properly. Try again, and if it keeps happening email hello@jod-z.com{error.digest ? ` with code ${error.digest}` : ""}.</p>
        <div className="page-ctas" style={{ marginTop: 28 }}>
          <Button variant="dark" onClick={reset}>Try again</Button>
          <Button href="/" variant="ghost-dark">Home</Button>
        </div>
      </div>
    </main>
  );
}
