"use client";
import { startTransition, useActionState, type FormEvent } from "react";
import type { FormState } from "@/lib/forms/schemas";

/**
 * Server-action form that keeps what the person typed when validation
 * fails. (A plain <form action> is reset by React after every submit.)
 */
export function useForm(action: (s: FormState, f: FormData) => Promise<FormState>) {
  const [state, dispatch, pending] = useActionState(action, { status: "idle" });
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => dispatch(data));
  };
  return { state, onSubmit, pending, errors: state.errors ?? {} };
}
