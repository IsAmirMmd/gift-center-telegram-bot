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
  role: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: "VIEWER",
  },
  balance: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0.0,
  },
  comment: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  friend: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = User;
User.sync({ alter: false });
