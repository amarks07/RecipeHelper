/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: require("path").join(__dirname, "../.."),
  },
};

module.exports = nextConfig;
