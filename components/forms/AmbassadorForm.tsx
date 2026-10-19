"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ambassadorAction } from "@/lib/forms/actions";
import { track } from "@/lib/analytics/client";
import { Button } from "../Button";
import { Check, Field, Honeypot, Turnstile } from "./Field";
import { useForm } from "./useForm";

/** Ambassador application. Under-16s name a parent or guardian, who must agree by email. */
export function AmbassadorForm({ source, onDone }: { source: "popup" | "partner-page"; onDone?: () => void }) {
  const { state, onSubmit, pending, errors } = useForm(ambassadorAction);
  const [age, setAge] = useState<"16plus" | "under16" | "">("");
  useEffect(() => { if (state.status === "ok") track("apply_ambassador"); }, [state.status]);

  if (state.status === "ok") {
    return (
      <div className="auth-done" role="status">
        <p>{state.message}</p>
        {state.devUrl && <p className="auth-dev-link"><a href={state.devUrl}>Development only: open the guardian consent link</a></p>}
        {onDone && <div style={{ marginTop: 16 }}><Button variant="gold" onClick={onDone}>Keep browsing</Button></div>}
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      <input type="hidden" name="source" value={source} />
      <Honeypot />
      <Field name="name" label="Full name" autoComplete="name" error={errors.name} />
      <Field name="email" type="email" label="Email" autoComplete="email" error={errors.email} />
      <Field name="handle" label="Instagram or TikTok" optional placeholder="@yourhandle" autoComplete="off" error={errors.handle} />
      <fieldset className="auth-radio" aria-describedby={errors.ageGroup ? "ageGroup-err" : undefined}>
        <legend>Age</legend>
        <label><input type="radio" name="ageGroup" value="16plus" checked={age === "16plus"} onChange={() => setAge("16plus")} /> 16 or over</label>
        <label><input type="radio" name="ageGroup" value="under16" checked={age === "under16"} onChange={() => setAge("under16")} /> Under 16</label>
        {errors.ageGroup && <span id="ageGroup-err" className="field-err">{errors.ageGroup}</span>}
      </fieldset>
      {age === "under16" && (
        <>
          <p className="auth-note">We need a parent or guardian&rsquo;s permission first. We will email them a link to agree, and only then review the application.</p>
          <Field name="guardianName" label="Parent or guardian's name" autoComplete="off" error={errors.guardianName} />
          <Field name="guardianEmail" type="email" label="Parent or guardian's email" autoComplete="off" error={errors.guardianEmail} />
        </>
      )}
      <Check name="terms" error={errors.terms}>
        I agree to the <Link href="/terms#ambassadors" className="auth-link" target="_blank">Ambassador terms</Link> and <Link href="/privacy" className="auth-link" target="_blank">privacy policy</Link>.
      </Check>
      <Turnstile />
      {state.status === "error" && state.message && <p className="auth-error" role="alert">{state.message}</p>}
      <Button type="submit" variant="gold" block disabled={pending}>{pending ? "Sending" : "Apply now"}</Button>
    </form>
  );
}
