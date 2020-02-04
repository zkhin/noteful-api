require('dotenv').config();
const {DB_URL, TEST_DB_URL} = require('./src/config');

module.exports = {
  'migrationsDirectory': 'migrations',
  'driver': 'pg',
  'connectionString': (process.env.NODE_ENV === 'test') 
    ? TEST_DB_URL
    : DB_URL,
  'ssl': !!process.env.SSL
};