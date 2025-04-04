require("dotenv").config()

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,
  databaseUrl: process.env.DATABASE_URL || "mongodb://localhost:27017/objectifs-db",
  jwtSecret: process.env.JWT_SECRET || "secret-key",
  jwtExpire: process.env.JWT_EXPIRE || "30d",
}

