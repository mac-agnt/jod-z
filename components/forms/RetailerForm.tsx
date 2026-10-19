"use client";
import { useEffect } from "react";
import Link from "next/link";
import { retailerAction } from "@/lib/forms/actions";
import { countries, storeTypes } from "@/lib/forms/schemas";
import { track } from "@/lib/analytics/client";
import { Check, Field, Honeypot, Select, TextArea, Turnstile } from "./Field";
import { useForm } from "./useForm";

export function RetailerForm() {
  const { state, onSubmit, pending, errors } = useForm(retailerAction);
  useEffect(() => { if (state.status === "ok") track("apply_retailer"); }, [state.status]);

  if (state.status === "ok") return <p className="auth-done" role="status">{state.message}</p>;

  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      <Honeypot />
      <div className="auth-row">
        <Field name="storeName" label="Store name" autoComplete="organization" error={errors.storeName} />
        <Field name="contactName" label="Your name" autoComplete="name" error={errors.contactName} />
      </div>
      <Field name="email" type="email" label="Email" autoComplete="email" placeholder="you@store.com" error={errors.email} />
      <div className="auth-row">
        <Field name="phone" type="tel" label="Phone" optional autoComplete="tel" error={errors.phone} />
        <Field name="website" label="Website or Instagram" optional autoComplete="url" error={errors.website} />
      </div>
      <Select name="storeType" label="Type of store" options={storeTypes} error={errors.storeType} />
      <div className="auth-row">
        <Field name="town" label="Town" autoComplete="address-level2" error={errors.town} />
        <Select name="country" label="Country" options={countries} error={errors.country} />
      </div>
      <Field name="vatNumber" label="VAT number" optional autoComplete="off" error={errors.vatNumber} />
      <TextArea name="message" label="Anything we should know" optional placeholder="Brands you stock, expected volumes" error={errors.message} />
      <Check name="consent" error={errors.consent}>
        Jod-Z can keep these details to review my application. <Link href="/privacy" className="auth-link" target="_blank">Privacy policy</Link>
      </Check>
      <Turnstile />
      {state.status === "error" && state.message && <p className="auth-error" role="alert">{state.message}</p>}
      <button type="submit" className="btn btn-light btn-block" disabled={pending}><span className="btn-label">{pending ? "Sending" : "Apply for a trade account"}</span></button>
    </form>
  );
}
