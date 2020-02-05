require("dotenv").config();
const { DATABASE_URL, TEST_DATABASE_URL } = require("./src/config");

module.exports = {
  migrationsDirectory: "migrations",
  driver: "pg",
  connectionString:
    process.env.NODE_ENV === "test" ? TEST_DATABASE_URL : DATABASE_URL,
  ssl: !!process.env.SSL
};
