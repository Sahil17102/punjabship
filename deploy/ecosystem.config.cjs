module.exports = {
  apps: [
    {
      name: 'punjabship-api',
      cwd: '/var/www/punjabship/api',
      script: 'local-api.mjs',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '750M',
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: '5014',
        DEMO_OTP: '123456',
        ADMIN_EMAIL: 'admin@punjabshiplogistics.com',
        ADMIN_PASSWORD: 'Demo@123',
        SMTP_CONFIG_FILE: '/var/www/punjabship/shared/mail.env',
      },
    },
  ],
}
