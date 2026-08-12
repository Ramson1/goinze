/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@goinze/shared-utils", "@goinze/shared-types"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.flutterwave.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.flutterwave.com https://api.ravepay.co https://flw-events-ge.myflutterwave.com https://*.flutterwave.com https://api-js.mixpanel.com",
              "frame-src https://checkout.flutterwave.com https://*.flutterwave.com",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
