import dotenv from 'dotenv';

dotenv.config({
  path: '.env.development.local',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
