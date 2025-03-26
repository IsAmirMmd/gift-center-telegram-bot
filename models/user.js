const { sequelize } = require("./sequelizeConf");
const { DataTypes } = require("sequelize");

const User = sequelize.define("User", {
  user_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  fullname: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  admin: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = User;

// User.sync({ force: true });
