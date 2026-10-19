import { Button } from "@/components/Button";

export function NotFoundBody() {
  return (
    <main className="page">
      <div className="wrap legal">
        <p className="label gold">404</p>
        <h1 className="serif page-title">Off <em>course.</em></h1>
        <p className="lede">That page has moved or never existed. The leggings are still where you left them.</p>
        <div className="page-ctas" style={{ marginTop: 28 }}>
          <Button href="/product/the-jod-z" variant="dark">Shop leggings</Button>
          <Button href="/" variant="ghost-dark">Home</Button>
        </div>
      </div>
    </main>
  );
}
