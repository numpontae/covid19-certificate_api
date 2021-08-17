import mysql from "promise-mysql";
import express from "express";
import bodyParser from "body-parser";
import { preRegister } from "./config/config";
import { rpa } from "./config/config";
import { di } from "./di";
import { Routes } from './routes';
const jinst = require("jdbc/lib/jinst");
const JDBC = require("jdbc");
// const sql = require('mssql')

// const config: any = {
//   server: 'vaccine-db.database.windows.net',
//   port: 1433,
//   user: 'svnh-vaccine',
//   password: 'S@m1t1vej',
//   database: 'phr-db',
//   connectionTimeout: 5000,
//   pool: {
//       max:50,
//       min:0,
//       idleTimeoutMillis: 5000
//   },
//   options: {
//       enableArithAbort: true,
//       encrypt: true, // for azure
//       trustServerCertificate: false // change to true for local dev / self-signed certs
//     }
// };
// sql.on('error', (err:any) => {
//   console.log(err.message)
// })

const app = express();
const port = 30020;
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use(bodyParser.json({ limit: "100mb" }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
const routes = new Routes(app);
routes.setRoutes();

const cache: any = {
  url: "jdbc:Cache://10.104.10.49:1972/prod-trak",
  user: "superuser",
  password: "sys",
  minpoolsize: 10,
  maxpoolsize: 20,
  maxidle: 20*60*1000,
};
const prodlab: any = {
  url: "jdbc:Cache://10.104.10.49:1972/prod-lab",
  user: "superuser",
  password: "sys",
  minpoolsize: 10,
  maxpoolsize: 20,
  maxidle: 20*60*1000,
};
// const registerConfig: any = {
//   user: preRegister.USER,
//   password: preRegister.PASSWORD,
//   host: preRegister.HOST,
//   port: preRegister.PORT,
//   connectionLimit : 10,
//   debug: false
// };
// const rpaConfig: any = {
//   user: rpa.USER,
//   password: rpa.PASSWORD,
//   host: rpa.HOST,
//   port: rpa.PORT,
//   connectionLimit : 10,
//   debug: false
// };
if (!jinst.isJvmCreated()) {
  jinst.addOption("-Xrs");
  jinst.setupClasspath([
    process.cwd() + "/src/jdk/cachedb.jar",
    process.cwd() + "/src/jdk/cacheextreme.jar",
    process.cwd() + "/src/jdk/cachegateway.jar",
    process.cwd() + "/src/jdk/cachejdbc.jar",
    process.cwd() + "/src/jdk/habanero.jar",
    process.cwd() + "/src/jdk/jtds-1.3.1.jar"
  ]);
}
let cacheInit = false;
let cachedb = new JDBC(cache);
let prodlabdb = new JDBC(prodlab);

app.listen(port, async () => {
  console.log(`server start with port ${port}`);
  // const poolsql = await sql.connect(config)
  //   await poolsql.request().query('SELECT 1', function (error: any, results: any, fields: any) {
  //       if (error) 
  //           throw error;
        
  //       console.log(`sql server connected`);
  //       di.set('sql', poolsql);
  //   });
  if (!cacheInit) {
    cachedb.initialize(function(err: any) {
      if (err) {
        console.log(err);
      } else {
        console.log('cache connect');
        cacheInit = true;
      }
    });
    di.set("cache", cachedb)

    prodlabdb.initialize(function(err: any) {
      if (err) {
        console.log(err);
      } else {
        console.log('prodlab connect');
        cacheInit = true;
      }
    });
    di.set("prodlab", prodlabdb)

  }
  
});
