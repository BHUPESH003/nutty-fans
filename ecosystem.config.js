const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '.env.qa');
const envQa = fs.existsSync(envPath)
  ? dotenv.parse(fs.readFileSync(envPath, { encoding: 'utf8' }))
  : {};

module.exports = {
  apps: [
    {
      name: 'nuttyfans-ws',
      script: './node_modules/.bin/tsx',
      args: 'src/server/index.ts',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env_qa: {
        ...envQa,
      },
    },
  ],
};
