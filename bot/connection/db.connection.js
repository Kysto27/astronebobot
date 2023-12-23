require("dotenv").config();
const Sequelize = require("sequelize");

// const db = new Sequelize(
//    process.env.POSTGRES_DATABASE,
//    process.env.POSTGRES_USERNAME,
//    process.env.POSTGRES_PASSWORD,
//    {
//       host: process.env.POSTGRES_HOST,
//       port: Number(process.env.POSTGRES_PORT),
//       dialect: process.env.POSTGRES_DIALECT
//    }
// );

const dbName = 'bd_neboprognozbot';
const dbUser = 'kysto27';
const dbPassword = 'B#5yBYUU%lPp';
const dbHost = 'localhost';
const dbPort = 5432;
const dbDialect = 'postgres';

const db = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect: dbDialect
});


console.log(process.env.POSTGRES_DATABASE);
console.log(process.env.POSTGRES_USERNAME);
console.log(process.env.POSTGRES_PASSWORD);
console.log(process.env.POSTGRES_HOST);
console.log(process.env.POSTGRES_PORT);
console.log(process.env.POSTGRES_DIALECT);

module.exports = db;