const { DataTypes } = require("sequelize");
const db = require("../connection/db.connection");
module.exports = db.define("user",
   {
      id: {
         type: DataTypes.INTEGER,
         autoIncrement: true,
         primaryKey: true,
         unique: true
      },
      chatID: {
         type: DataTypes.BIGINT,
         allowNull: false
      },
      firstName: {
         type: DataTypes.STRING
      },
      lastName: {
         type: DataTypes.STRING
      },
      username: {
         type: DataTypes.STRING,
         allowNull: true
      },
      admin: {
         type: DataTypes.BOOLEAN,
         defaultValue: false
      },
      startPayload: {
         type: DataTypes.STRING
      }
   },
   {
      timestamps: true,
      updatedAt: false
   }
);
