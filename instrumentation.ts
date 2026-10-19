import type { Instrumentation } from "next";

// Error monitoring is opt-in: nothing loads unless a Sentry DSN is set.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

export async function register() {
  if (!dsn) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.init({ dsn, tracesSampleRate: 0.1, environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV });
}

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (!dsn) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(err, request, context);
};
