/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3", "pdfkit", "puppeteer-core", "@libsql/client", "@sparticuz/chromium"]
  }
};

export default nextConfig;
