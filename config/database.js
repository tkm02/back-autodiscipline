const mongoose = require("mongoose");
const config = require("./config");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.databaseUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    console.log(`MongoDB connecté: ${conn.connection.host}`)
  } catch (error) {
    console.error(`Erreur de connexion à MongoDB: ${error.message}`)
    process.exit(1)
  }
}

module.exports = connectDB

