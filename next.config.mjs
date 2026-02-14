/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignore Watchpack errors for Windows system files
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/node_modules',
          '**/.git',
          '**/C:/hiberfil.sys',
          '**/C:/pagefile.sys',
          '**/C:/swapfile.sys',
          '**/C:/DumpStack.log.tmp',
        ],
      };
    }
    return config;
  },
};

export default nextConfig;
