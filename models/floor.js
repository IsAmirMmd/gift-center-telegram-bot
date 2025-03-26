// models/FloorPrice.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("./sequelizeConf");

const FloorPrice = sequelize.define("FloorPrice", {
  gift_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  model: {
    type: DataTypes.STRING,
  },
  last_updated: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = FloorPrice;
