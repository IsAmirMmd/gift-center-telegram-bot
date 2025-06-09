const { sequelize } = require("./sequelizeConf");
const { DataTypes } = require("sequelize");

const AutoPurchase = sequelize.define("AutoPurchase", {
  minPrice: {
    type: DataTypes.INTEGER,
    defaultValue: 1000,
  },
  maxPrice: {
    type: DataTypes.INTEGER,
    defaultValue: 100000,
  },
  maxSupply: {
    defaultValue: 150000,
    type: DataTypes.INTEGER,
  },
  quantity: {
    defaultValue: 1,
    type: DataTypes.INTEGER,
  },
  user_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

module.exports = AutoPurchase;

AutoPurchase.sync({ alter: false })
  .then(() => {
    console.log("AutoPurchase table synced successfully");
  })
  .catch((error) => {
    console.error("Error syncing AutoPurchase table:", error);
  });
