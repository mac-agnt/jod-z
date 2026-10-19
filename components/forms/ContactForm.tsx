"use client";
import { useEffect } from "react";
import { contactAction } from "@/lib/forms/actions";
import { contactTopics } from "@/lib/forms/schemas";
import { track } from "@/lib/analytics/client";
import { Field, Honeypot, Select, TextArea, Turnstile } from "./Field";
import { useForm } from "./useForm";

export function ContactForm() {
  const { state, onSubmit, pending, errors } = useForm(contactAction);
  useEffect(() => { if (state.status === "ok") track("contact"); }, [state.status]);

  if (state.status === "ok") return <p className="auth-done" role="status">{state.message}</p>;

  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      <Honeypot />
      <div className="auth-row">
        <Field name="name" label="Name" autoComplete="name" error={errors.name} />
        <Field name="email" type="email" label="Email" autoComplete="email" error={errors.email} />
      </div>
      <div className="auth-row">
        <Select name="topic" label="Topic" options={contactTopics} error={errors.topic} />
        <Field name="orderNumber" label="Order number" optional autoComplete="off" error={errors.orderNumber} />
      </div>
      <TextArea name="message" label="Message" error={errors.message} />
      <Turnstile />
      {state.status === "error" && state.message && <p className="auth-error" role="alert">{state.message}</p>}
      <button type="submit" className="btn btn-light btn-block" disabled={pending}><span className="btn-label">{pending ? "Sending" : "Send message"}</span></button>
    </form>
  );
}
