module.exports = {
  apps: [{
    name: 'wa-dashboard',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: process.cwd(), // Automatically uses current directory
    instances: 1,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      WHATSAPP_ACCESS_TOKEN: process.env.WA_ACCESS_TOKEN,
      WHATSAPP_PHONE_NUMBER_ID: process.env.WA_PHONE_NUMBER_ID,
      WHATSAPP_BUSINESS_ACCOUNT_ID: process.env.WA_BUSINESS_ACCOUNT_ID,
      META_APP_ID: process.env.META_APP_ID,
      META_APP_SECRET: process.env.META_APP_SECRET,
      WEBHOOK_URL: process.env.WEBHOOK_URL,
      EMAILABLE_API_KEY: 'live_67150ed8d69288aaa56d',
      REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379'
    }
  }, {
    name: "wa-webhook-worker",
    script: "dist/workers/webhook.worker.js", // Assumes build step
    instances: 1,
    autorestart: true,
    max_memory_restart: "700M",
    env: {
      NODE_ENV: "production",
      REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379'
    }
  }]
}