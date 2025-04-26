// models/gift.js
const { sequelize } = require("./sequelizeConf");
const { DataTypes } = require("sequelize");

const Gift = sequelize.define("Gift", {
  gift_name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  gift_models: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  checkFloor: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: true,
  },
  fullCompare: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = Gift;

Gift.sync({ alter: false })
  .then(() => {
    console.log("Gift table synced successfully");
  })
  .catch((error) => {
    console.error("Error syncing Gift table:", error);
  });
