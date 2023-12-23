require("dotenv").config();
const Sequelize = require("sequelize");

const db = new Sequelize(
   process.env.POSTGRES_DATABASE,
   process.env.POSTGRES_USERNAME,
   process.env.POSTGRES_PASSWORD,
   {
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT),
      dialect: process.env.POSTGRES_DIALECT
   }
);

console.log(process.env.POSTGRES_DATABASE);
console.log(process.env.POSTGRES_USERNAME);
console.log(process.env.POSTGRES_PASSWORD);
console.log(process.env.POSTGRES_HOST);
console.log(process.env.POSTGRES_PORT);
console.log(process.env.POSTGRES_DIALECT);

module.exports = db;