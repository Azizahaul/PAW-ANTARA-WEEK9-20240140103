const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: "Username tidak boleh kosong",
        },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false, // ini bakal nyimpen hash, bukan plain text
      validate: {
        notEmpty: {
          msg: "Password tidak boleh kosong",
        },
      },
    },
  },
  {
    tableName: "users",
    timestamps: true,
  },
);

module.exports = User;
