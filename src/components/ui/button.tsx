import type { ComponentProps } from "react";

export function Button({ variant = "primary", className = "", type = "button", ...props }: ComponentProps<"button"> & { variant?: "primary" | "secondary" | "ghost" }) {
  return <button type={type} className={`button button--${variant} ${className}`} {...props} />;
}
