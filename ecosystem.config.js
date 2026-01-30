module.exports = {
  apps: [{
    name: 'dms-frontend',
    script: 'npm',
    args: 'start',
    cwd: '/home/fortytwoev/dms-frontend',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    instances: 1,
    autorestart: true,
    watch: false, // Set to true for development auto-reload on file changes
    watch_delay: 1000,
    ignore_watch: ['node_modules', '.next', 'logs', '*.log'],
    max_memory_restart: '2G',
    error_file: '/home/fortytwoev/dms-frontend/logs/frontend-error.log',
    out_file: '/home/fortytwoev/dms-frontend/logs/frontend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
  }]
};
