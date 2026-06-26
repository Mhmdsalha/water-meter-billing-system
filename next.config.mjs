/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3", "pdfkit", "puppeteer-core", "@libsql/client", "@sparticuz/chromium"],
    outputFileTracingIncludes: {
      "/api/pdf/[cycleId]": [
        "./node_modules/@sparticuz/chromium/bin/**/*",
        "./node_modules/@fontsource/noto-sans-arabic/files/**/*"
      ]
    }
  }
};

export default nextConfig;
