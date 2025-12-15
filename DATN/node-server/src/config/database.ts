import { Sequelize } from "sequelize-typescript";

import { Dialect } from "sequelize";

import dotenv from "dotenv";

dotenv.config({quiet: true});

export const sequelize = new Sequelize({
     database: process.env.DB_DATABASE ?? "dbladb",
    username: process.env.DB_USERNAME ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    host: process.env.DB_HOST ?? "hostlahost",
    dialect: (process.env.DB_DIALECT as Dialect) ?? "doãnem",
    models: [__dirname + "/models"],//chạy tất model ts
    logging: false//im nha mày
})