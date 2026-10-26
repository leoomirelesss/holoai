import type { ComponentProps, ReactNode } from "react";
import { Icon } from "./icon";

export function Card({ className = "", ...props }: ComponentProps<"section">) {
  return <section className={`card ${className}`} {...props} />;
}

export function Badge({ children }: { children: ReactNode }) {
  return <span className="badge">{children}</span>;
}

export function Notice({ title, children, tone = "info" }: { title: string; children: ReactNode; tone?: "info" | "warning" }) {
  return (
    <div className={`notice notice--${tone}`}>
      <Icon name="info" />
      <div><p className="notice-title">{title}</p><div className="notice-body">{children}</div></div>
    </div>
  );
}
