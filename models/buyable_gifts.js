const { sequelize } = require("./sequelizeConf");
const { DataTypes } = require("sequelize");

const BuyableGifts = sequelize.define("BuyableGifts", {
  gift_name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
});

module.exports = BuyableGifts;

BuyableGifts.sync({ alter: false })
  .then(() => {
    console.log("BuyableGifts table synced successfully");
  })
  .catch((error) => {
    console.error("Error syncing BuyableGifts table:", error);
  });
