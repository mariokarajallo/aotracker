import type { NextConfig } from "next";

const ngrokUrl = process.env.NGROK_URL?.replace(/^https?:\/\//, "");

const nextConfig: NextConfig = {
  ...(ngrokUrl ? { allowedDevOrigins: [ngrokUrl] } : {}),
};

export default nextConfig;
