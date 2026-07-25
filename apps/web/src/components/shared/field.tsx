import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The one form-control system for the app: a labelled Field wrapper plus
 * Input / Textarea / Select that carry the shared brand styling, replacing the
 * raw `<input className="…">` copy-pasted across every modal. Focus rings come
 * from the global :focus-visible rule (see globals.css). Consistent validation
 * display lives here via the `error` and `hint` props.
 */

const CONTROL_CLASS =
  "w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px] bg-white text-[var(--ink)] text-[14px] placeholder:text-[var(--stone)] disabled:bg-[var(--paper)] disabled:text-[var(--stone)] aria-[invalid=true]:border-[var(--error)]";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(CONTROL_CLASS, className)} {...props} />;
  },
);

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(CONTROL_CLASS, "resize-y", className)} {...props} />;
  },
);

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, ...props }, ref) {
    return <select ref={ref} className={cn(CONTROL_CLASS, "appearance-none pr-8", className)} {...props} />;
  },
);

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  className,
  children,
}: {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="block text-[13px] font-semibold mb-[6px]">
          {label}
          {!required && <span className="text-[var(--stone)] font-normal"> (optional)</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-[6px] text-[12px] text-[var(--error)]">{error}</p>
      ) : hint ? (
        <p className="mt-[6px] text-[12px] text-[var(--stone)]">{hint}</p>
      ) : null}
    </div>
  );
}
