module.exports = {
  apps: [
    {
      name: "wa-dashboard",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: process.cwd(),
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379/1"
      }
    },
    {
      name: "wa-webhook-worker",
      script: "dist/src/workers/webhook.worker.cjs",
      cwd: process.cwd(),
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "700M",
      env: {
        NODE_ENV: "production",
        REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379/1"
      }
    }
  ]
};
