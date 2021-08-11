import dotenv from "dotenv";
const dotenvParseVariables = require("dotenv-parse-variables");
let env: any = dotenv.config();
if (env.error) throw env.error;
env = dotenvParseVariables(env.parsed);

export const 
  Secret = {
    SECRET: env.SECRET_KEY || 'SECRET_KEY',
  },
  preRegister = {
    HOST: env.HOST,
    PORT: env.PORT,
    USER: env.USER,
    PASSWORD: env.PASSWORD,
    DATABASE_NAME: env.DATABASENAME,
  },
  rpa = {
    HOST: '10.105.10.52',
    PORT: '3306',
    USER: 'app',
    PASSWORD: 'app@1234',
    DATABASE_NAME: 'aa_register',
  },
  rpaSetting = {
    SERVER: env.SERVER,
    SERVER_TYPE: env.SERVER_TYPE,
  },
  neo4jSetting = {
    URL: 'bolt://10.105.107.65:7687',
    USER: 'neo4j',
    PASSWORD: 'svhadmin.641'
  }
