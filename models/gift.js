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
});

module.exports = Gift;

Gift.sync({ force: false })
  .then(() => {
    console.log("Gift table synced successfully");
  })
  .catch((error) => {
    console.error("Error syncing Gift table:", error);
  });
