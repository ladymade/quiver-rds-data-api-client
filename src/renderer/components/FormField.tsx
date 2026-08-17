import type React from "react";

type FormFieldProps = {
  children: React.ReactNode;
  helperText: string;
  id: string;
  label: string;
  mono?: boolean;
};

export function FormField({
  children,
  helperText,
  id,
  label,
  mono = false,
}: FormFieldProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-2.5">
      <label className="stitch-label-md text-slate-900" htmlFor={id}>
        {label}
      </label>
      {children}
      {helperText.length > 0 ? (
        <p className={`stitch-body-sm text-slate-500 ${mono ? "font-mono" : ""}`}>{helperText}</p>
      ) : null}
    </div>
  );
}
