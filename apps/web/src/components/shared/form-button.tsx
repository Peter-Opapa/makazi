"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "destructive";

export interface FormButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--green)] text-white hover:bg-[var(--green-deep)] disabled:bg-[var(--line-2)] disabled:text-[var(--ink)] disabled:opacity-60",
  outline: "bg-transparent text-[var(--ink)] border-[1.5px] border-[var(--line-2)] hover:border-[var(--ink)]",
  destructive: "bg-[var(--error)] text-white hover:brightness-95",
};

export function FormButton({
  variant = "primary",
  fullWidth = true,
  className,
  type = "button",
  ...props
}: FormButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "rounded-[10px] px-[14px] py-[14px] text-[15px] font-semibold transition-colors disabled:cursor-default",
        fullWidth && "w-full",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
