/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@libsql/client", "libsql"],
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;
