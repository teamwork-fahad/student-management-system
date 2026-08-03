const env = {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,

  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,

  SUPER_ADMIN_NAME: process.env.SUPER_ADMIN_NAME,
  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD,
};

export default env;