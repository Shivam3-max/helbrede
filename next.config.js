/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["mysql2"],
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;
