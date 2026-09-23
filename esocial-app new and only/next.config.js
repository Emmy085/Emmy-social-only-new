const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Belt-and-suspenders alongside jsconfig.json: makes "@/..." resolve to the
    // project root no matter what, even if jsconfig.json isn't being picked up.
    config.resolve.alias['@'] = __dirname;
    return config;
  },
};

module.exports = nextConfig;
