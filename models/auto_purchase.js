const { sequelize } = require("./sequelizeConf");
const { DataTypes } = require("sequelize");

const AutoPurchase = sequelize.define("AutoPurchase", {
  minPrice: {
    type: DataTypes.STRING,
  },
  maxPrice: {
    type: DataTypes.STRING,
  },
  maxSupply: {
    type: DataTypes.INTEGER,
  },
  quantity: {
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
