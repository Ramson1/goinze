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
};

export default nextConfig;
