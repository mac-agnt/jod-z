"use client";
import { useState, type FormEvent } from "react";
import { Button } from "./Button";

export type Field = { name: string; label: string; type?: "text" | "email" | "url" | "number" | "textarea" | "select"; required?: boolean; options?: string[]; help?: string; half?: boolean };

export function PortalForm({ fields, submitLabel, success }: { fields: Field[]; submitLabel: string; success: string }) {
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const next: Record<string, string> = {};
    for (const f of fields) {
      const v = String(data.get(f.name) ?? "").trim();
      if (f.required && !v) next[f.name] = `${f.label} is required.`;
      else if (f.type === "email" && v && !/^\S+@\S+\.\S+$/.test(v)) next[f.name] = "Enter a valid email address.";
    }
    setErrors(next);
    if (Object.keys(next).length === 0) setSent(true); // TODO: POST to CRM / Shopify B2B endpoint
  };

  if (sent) {
    return (
      <div className="form-done" role="status">
        <p className="serif" style={{ fontSize: 34, lineHeight: 1.1 }}>Thank you.</p>
        <p className="muted">{success}</p>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      {fields.map((f) => {
        const id = `f-${f.name}`;
        const err = errors[f.name];
        const common = { id, name: f.name, "aria-invalid": !!err, "aria-describedby": err ? `${id}-err` : f.help ? `${id}-help` : undefined };
        return (
          <div key={f.name} className={`field ${f.half ? "half" : ""}`}>
            <label htmlFor={id}>{f.label}{f.required ? "" : <span className="muted"> (optional)</span>}</label>
            {f.type === "textarea" ? (
              <textarea {...common} rows={4} />
            ) : f.type === "select" ? (
              <select {...common} defaultValue="">
                <option value="" disabled>Select</option>
                {f.options?.map((o) => <option key={o}>{o}</option>)}
              </select>
            ) : (
              <input {...common} type={f.type ?? "text"} />
            )}
            {f.help && !err && <p id={`${id}-help`} className="help">{f.help}</p>}
            {err && <p id={`${id}-err`} className="err">{err}</p>}
          </div>
        );
      })}
      <div className="field"><Button type="submit" variant="dark">{submitLabel}</Button></div>
    </form>
  );
}
