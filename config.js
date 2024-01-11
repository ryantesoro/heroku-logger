const dotenv = require('dotenv');

dotenv.config();

const requiredEnv = ['HEROKU_API_KEY'];
requiredEnv.forEach((env) => {
  if (!process.env[env]) {
    throw new Error(`Missing required env var ${env}`);
  }
});

module.exports = {
  heroku_api_key: process.env.HEROKU_API_KEY,
  heroku_app_names: [
    process.env.HEROKU_APP_NAME,
    process.env.HEROKU_APP_NAME_1,
  ],
};
