import type { NextConfig } from "next";

const config: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Confirmation links are temporary credentials; never log their query strings.
  logging: { incomingRequests: { ignore: [/^\/auth\/(?:callback|confirm)(?:[/?]|$)/, /^\/api\/v1(?:[/?]|$)/] } },
  async headers() {
    return [
      { source: "/auth/:path*", headers: [
        { key: "Cache-Control", value: "private, no-store, max-age=0" },
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "X-Content-Type-Options", value: "nosniff" },
      ] },
      { source: "/app/:path*", headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }] },
    ];
  },
};

export default config;
