const { DataTypes } = require("sequelize");
const { sequelize } = require("./sequelizeConf");

const TFilteredData = {
  user_id: "user_id",
  backgrounds: "backgrounds",
  minPrice: "minPrice",
  maxPrice: "maxPrice",
  models: "models",
  gifts: "gifts",
};

const FilteredData = sequelize.define("FilteredData", {
  backgrounds: {
    type: DataTypes.STRING,
  },
  minPrice: {
    type: DataTypes.FLOAT,
  },
  maxPrice: {
    type: DataTypes.FLOAT,
  },
  models: {
    type: DataTypes.STRING,
  },
  gifts: {
    type: DataTypes.STRING,
  },
});

module.exports = { FilteredData, TFilteredData };
