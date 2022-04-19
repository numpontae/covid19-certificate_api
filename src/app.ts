import mysql from "promise-mysql";
import express from "express";
import bodyParser from "body-parser";
import {preRegister} from "./config/config";
import {rpa} from "./config/config";
import {di} from "./di";
import {Routes} from './routes';
const jinst = require("jdbc/lib/jinst");
const JDBC = require("jdbc");
const sql = require('mssql')
import axios from 'axios'

const config: any = {
    server: 'vaccine-db.database.windows.net',
    port: 1433,
    user: 'svnh-vaccine',
    password: 'S@m1t1vej',
    database: 'phr-db',
    connectionTimeout: 5000,
    pool: {
        max: 50,
        min: 0,
        idleTimeoutMillis: 5000
    },
    options: {
        enableArithAbort: true,
        encrypt: true, // for azure
        trustServerCertificate: false // change to true for local dev / self-signed certs
    }
};
sql.on('error', (err : any) => {
    console.log(err.message)
})

const app = express();
const port = 30020;
app.use(bodyParser.urlencoded({extended: true, limit: "50mb"}));
app.use(bodyParser.json({limit: "100mb"}));
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});
const routes = new Routes(app);
routes.setRoutes();

const cache: any = {
    url: "jdbc:Cache://10.105.10.89:1972/prod-trak",
    user: "superuser",
    password: "sys",
    // user: "thanongsakch",
    // password: "b@nKkIn4511",
    minpoolsize: 2,
    maxpoolsize: 10,
    maxidle: 20 * 60 * 1000
};
// const cache: any = {
// url: "jdbc:Cache://10.104.10.109:1972/BASE-TRAK",
// user: "lbsdev",
// password: "L฿$dEv1552",
// minpoolsize: 10,
// maxpoolsize: 20,
// maxidle: 20*60*1000,
// };
const prodlab: any = {
    url: "jdbc:Cache://10.105.10.89:1972/prod-lab",
    user: "superuser",
    password: "sys",
    minpoolsize: 2,
    maxpoolsize: 10,
    maxidle: 20 * 60 * 1000
};
const registerConfig: any = {
    user: preRegister.USER,
    password: preRegister.PASSWORD,
    host: preRegister.HOST,
    port: preRegister.PORT,
    connectionLimit: 10,
    debug: false
};

const dataCenterConfig: any = {
    user: 'svhadmin',
    password: 'svhadmin.641',
    host: '10.105.10.29',
    port: 3306,
    connectionLimit: 10,
    debug: false
};
// const rpaConfig: any = {
// user: rpa.USER,
// password: rpa.PASSWORD,
// host: rpa.HOST,
// port: rpa.PORT,
// connectionLimit : 10,
// debug: false
// };
if (! jinst.isJvmCreated()) {
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
// let cachedb = new JDBC(cache);
// let prodlabdb = new JDBC(prodlab);

app.listen(port, async () => {
    console.log(`server start with port ${port}`);
    const pool = await mysql.createPool(registerConfig);
    pool.getConnection();
    pool.query('SELECT 1', function (error: any, results: any, fields: any) {
        if (error) 
            throw error;
        
        console.log(`mysql connected`);
        di.set('repos', pool);
    });

    const poolDataCenter = await mysql.createPool(dataCenterConfig);
    poolDataCenter.getConnection();
    poolDataCenter.query('SELECT 1', function (error: any, results: any, fields: any) {
        if (error) 
            throw error;
        
        console.log(`dataCenter connected`);
        di.set('dataCenter', poolDataCenter);
    });
    // const poolsql = await sql.connect(config)
    // await poolsql.request().query('SELECT 1', function (error: any, results: any, fields: any) {
    //       if (error)
    //           throw error;

    //       console.log(`sql server connected`);
    //       di.set('sql', poolsql);
    // });
    var usernameprodtrak = 'prodtrak';
    var passwordprodtrak = 'prodtr@kserver';
    var auth = 'Basic ' + Buffer.from(usernameprodtrak + ':' + passwordprodtrak).toString('base64');
    await axios({
        method: 'post',
        url: `http://10.104.10.85:1880/prodtrakserver`,
        headers: {
            'Authorization': auth
        }
    }).then(function (response: any) {
        // jdbc:Cache://10.104.10.109:1972/BASE-TRAK
        cache.user = response.data.username
    cache.password = response.data.password
        cache.url = `jdbc:Cache://${
            response.data.server
        }:${
            response.data.port
        }/${
            response.data.database
        }`
        console.log('111')
    }).catch(function (error) {
        console.log(error)

        // res.send(response.data)
    })
    
    let cachedb = new JDBC(cache);

    var usernameprodlab = 'prodlab';
    var passwordprodlab = 'prodl@bserver';
    var auth = 'Basic ' + Buffer.from(usernameprodlab + ':' + passwordprodlab).toString('base64');
    await axios({
        method: 'post',
        url: `http://10.104.10.85:1880/prodlabserver`,
        headers: {
            'Authorization': auth
        }
    }).then(function (response: any) {
        // jdbc:Cache://10.104.10.109:1972/BASE-TRAK
        prodlab.user = response.data.username
        prodlab.password = response.data.password
        prodlab.url = `jdbc:Cache://${
            response.data.server
        }:${
            response.data.port
        }/${
            response.data.database
        }`
        console.log('222')
    }).catch(function (error) {
        console.log(error)

        // res.send(response.data)
    })

    let prodlabdb = new JDBC(prodlab);

    if (! cacheInit) {
        console.log('333')
        cachedb.initialize(function (err: any) {
            if (err) {
                console.log(err);
            } else {
                console.log('cache connect');
                cacheInit = true;
            }
        });
        di.set("cache", cachedb)

        prodlabdb.initialize(function (err: any) {
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
