import withPWA from "next-pwa";
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ibb.co",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "d2dacdhzndo9w4.cloudfront.net",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "d1kgd37c1b2jmu.cloudfront.net",
        pathname: "**",
      },
    ],
  },
};

// next-pwa hooks into webpack, so dev and build run with --webpack
// (see package.json). The service worker and workbox files are generated
// into public/ at build time and are not committed.
const pwa = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

export default pwa(nextConfig);
