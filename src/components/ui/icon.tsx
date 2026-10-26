import type { SVGProps } from "react";

type IconName = "arrow" | "check" | "close" | "menu" | "globe" | "edit" | "info" | "chevron";

const paths: Record<IconName, string> = {
  arrow: "M4 12h16m-6-6 6 6-6 6",
  check: "m5 12 4 4L19 6",
  close: "m6 6 12 12M6 18 18 6",
  menu: "M4 6h16M4 12h16M4 18h16",
  globe: "M3 12h18M12 3c6 6 6 12 0 18M12 3c-6 6-6 12 0 18",
  edit: "m4 16 12-12 4 4L8 20H4v-4Zm10-10 4 4",
  info: "M12 11v6m0-10v.01",
  chevron: "m9 6 6 6-6 6",
};

/** Original geometric icons. No external assets or runtime icon dependency. */
export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="icon" {...props}>
      {(name === "globe" || name === "info") && <circle cx="12" cy="12" r="9" />}
      <path d={paths[name]} />
    </svg>
  );
}
