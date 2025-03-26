// models/index.js
const { Sequelize } = require("sequelize");
const { cred } = require("../config/bot");

const sequelize = new Sequelize(
  cred.database, // Database name
  cred.username, // Username
  cred.password, // Password
  {
    host: cred.host,
    port: 3306,
    dialect: cred.dialect,
    logging: false,
  }
);

sequelize.authenticate().then(() => {
  console.log("auth");
});

// Sync the models with the database
sequelize
  .sync({ force: false })
  .then(() => {
    console.log("Database synced");
  })
  .catch((error) => {
    console.error("Error syncing database:", error);
  });

module.exports = {
  sequelize,
};
