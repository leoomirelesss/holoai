import type { ComponentProps } from "react";

type FieldProps = { id: string; label: string; hint?: string; error?: string };

export function Field({ id, label, hint, error, ...props }: FieldProps & ComponentProps<"input">) {
  const description = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} className="input" aria-describedby={description} aria-invalid={Boolean(error)} {...props} />
      {hint && <p id={`${id}-hint`} className="field-hint">{hint}</p>}
      {error && <p id={`${id}-error`} className="field-error">{error}</p>}
    </div>
  );
}

export function TextAreaField({ id, label, hint, error, ...props }: FieldProps & ComponentProps<"textarea">) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <textarea id={id} className="input textarea" aria-describedby={[hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined} aria-invalid={Boolean(error)} {...props} />
      {hint && <p id={`${id}-hint`} className="field-hint">{hint}</p>}
      {error && <p id={`${id}-error`} className="field-error">{error}</p>}
    </div>
  );
}
