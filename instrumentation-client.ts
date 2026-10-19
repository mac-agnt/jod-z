// Browser error monitoring, loaded only when a Sentry DSN is configured so
// the bundle stays lean otherwise.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({ dsn, tracesSampleRate: 0.1, environment: process.env.NODE_ENV });
  });
}
