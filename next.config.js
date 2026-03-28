/** @type {import('next').NextConfig} */
const nextConfig = {
  api: {
    bodyParser: false, // Required for Stripe webhooks
  },
};

module.exports = nextConfig;
