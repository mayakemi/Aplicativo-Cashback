const mongoose = require('mongoose');
const { getEnv } = require('./env');

async function connectDB() {
  const uri = getEnv('MONGODB_URI');
  mongoose.set('strictQuery', true);

  await mongoose.connect(uri);
  // eslint-disable-next-line no-console
  console.log('MongoDB conectado');
}

module.exports = { connectDB };

