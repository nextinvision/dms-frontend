module.exports = {
  apps: [{
    name: 'frontend-dev',
    script: 'npm',
    args: 'start',
    cwd: '/home/fortytwoev/dms-dev/frontend',
    env: {
      NODE_ENV: 'development',
      PORT: 3003,
      NEXT_PUBLIC_API_URL: '/dev-api',
      NEXT_PUBLIC_BASE_PATH: '/dev'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
  }]
};
