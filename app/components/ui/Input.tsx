import { forwardRef, InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes } from "react";

export const Label = ({ className = "", ...props }: LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={`text-sm font-medium text-slate-600 ${className}`} {...props} />
);

const FIELD_CLASSES =
  "w-full rounded-xl bg-white border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => (
    <input ref={ref} className={`${FIELD_CLASSES} ${className}`} {...props} />
  )
);
Input.displayName = "Input";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = "", ...props }, ref) => (
    <select ref={ref} className={`${FIELD_CLASSES} ${className}`} {...props} />
  )
);
Select.displayName = "Select";
