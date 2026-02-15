/**
 * PM2 Ecosystem Configuration
 * Manages backend API process
 * 
 * Usage:
 * - Start all: pm2 start ecosystem.config.cjs
 * - Start specific: pm2 start ecosystem.config.cjs --only backend
 * - Stop all: pm2 stop all
 * - Restart all: pm2 restart all
 * - Monitor: pm2 monit
 * - Logs: pm2 logs
 */

module.exports = {
  apps: [
    {
      name: 'backend',
      script: './backend/server.js',
      cwd: '/home/ubuntu/my-react-app',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_file: './backend/.env',
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4242
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};