import {Request, Response, Router} from 'express'
import {di} from '../di'
import * as _ from 'lodash'
import CryptoJS from "crypto-js";
import moment from 'moment-timezone';
moment.tz.setDefault('Asia/Bangkok');
import axios from 'axios'
import {neo4jSetting} from "../config/config";

class ctRoute {
    Capitalize = (s : any) => {
        if (typeof s !== 'string') 
            return ''


        


        return s.charAt(0).toUpperCase() + s.slice(1)
    }





    postPatientLabCovid19() {
        return async (req : Request, res : Response) => {
            let repos = di.get('sql')
            let queryDelete = `DELETE PHR_Covid19_Certificate WHERE LabNumber = '${req.body[0].LabNumber}'`
            await repos.query(queryDelete);

            let queryInfo = `INSERT INTO PHR_Covid19_Certificate
            (Dte_of_col, EPVIS_Age, EPVIS_Sex, EN, EPVIS_DateOfBirth, 
            Gvn_nme, Sur_nme, Tme_of_Col, LabNumber, HN, VISTS_Dte_of_aut, VISTS_Tme_of_aut, 
            VISTS_Usr_aut, CTTS_Nme,
            Usr_aut, DoctorName, Site
            , Usr_report, report_date, report_time)
              VALUES('${req.body[0].Dte_of_col}', '${req.body[0].EPVIS_Age}', '${req.body[0].EPVIS_Sex}', 
              '${req.body[0].EN}', '${req.body[0].EPVIS_DateOfBirth}'
              , '${req.body[0].Gvn_nme}', '${req.body[0].Sur_nme}', '${req.body[0].Tme_of_Col}'
              , '${req.body[0].LabNumber}', '${req.body[0].HN}', '${req.body[0].VISTS_Dte_of_aut}'
              , '${req.body[0].VISTS_Tme_of_aut}', '${req.body[0].VISTS_Usr_aut}','${req.body[0].CTTS_Nme}'
              , '${req.body[0].Usr_aut}', '${req.body[0].DoctorName}','${req.body[0].Site}'
              , '${req.body[0].Usr_report}', '${req.body[0].report_date}', '${req.body[0].report_time}');
              `
            await repos.query(queryInfo);

            queryDelete = `DELETE PHR_Covid19_Certificate_LabResult WHERE LabNumber = '${req.body[0].LabNumber}'`
                await repos.query(queryDelete);
            req.body.map(async(d:any)=> {
                
                let queryInfo = `INSERT INTO PHR_Covid19_Certificate_LabResult
                (LabNumber, CTTC_Cde, CTTC_Des, LabResult)
                VALUES('${d.LabNumber}','${d.CTTC_Cde}', '${d.CTTC_Des}', '${d.LabResult}')
              `
                await repos.query(queryInfo);
            })
            res.send([])

        }
    }

    getLabCovid19() {
        return async (req : Request, res : Response) => {
            let {labnumber} = req.query
            let repos = di.get('sql')
            let querySearch = `SELECT A.*, B.CTTC_Cde, B.CTTC_Des, B.LabResult FROM PHR_Covid19_Certificate A
            INNER JOIN PHR_Covid19_Certificate_LabResult B ON A.LabNumber = B.LabNumber WHERE A.LabNumber = '${labnumber}'`
            let result = await repos.query(querySearch);
            res.send(result.recordset)
        }
    }

    getPatientLabList() {
        return async (req : Request, res : Response) => {
            let {hn, orderstartdate} = req.query
            let repos = di.get('repos')
            repos = di.get("prodlab");
            let orderstartdatecondition = ''
            if (!_.isEmpty(orderstartdate))
            {
                orderstartdatecondition = ` and EPVIS_DateOfCollection = '${orderstartdate}'`
            }
            let result: any = await new Promise((resolve, reject) => {
                repos.reserve((err : any, connObj : any) => {
                    if (connObj) {
                        let conn = connObj.conn;
                        conn.createStatement((err : any, statement : any) => {
                            if (err) {
                                reject(err);
                            } else {
                                statement.setFetchSize(100, function (err : any) {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        const query = `select top 5 * from (select distinct EPVIS_DateOfCollection AS Dte_of_col,EPVIS_VisitNumber AS LabNumber, EP_VisitTestSet->VISTS_TestSet_DR->CTTS_Code AS CTTS_Cde, 
                                            EP_VisitTestSet->VISTS_TestSet_DR->CTTS_Name AS CTTS_Nme, EPVIS_TimeOfCollection AS Tme_of_Col 
                                            FROM EP_VisitNumber where EPVIS_DebtorNumber_DR = '${hn}' ${orderstartdatecondition})
                                            order by Dte_of_col desc`;
                                        statement.executeQuery(query, function (err : any, resultset : any) {
                                            if (err) {
                                                reject(err);
                                            } else {
                                                resultset.toObjArray(function (err : any, results : any) {
                                                    resolve(results);
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                        repos.release(connObj, function (err : any) {
                            if (err) {
                                console.log(err);
                            }
                        });
                    }
                });
                
            });

            var dateFormat = require("dateformat");
            function convertHMS(value:any) {
                let sec = parseInt(value, 10); // convert value to number if it's string
                sec = sec * 60
                let hours:any   = Math.floor(sec / 3600); // get hours
                let minutes:any = Math.floor((sec - (hours * 3600)) / 60); // get minutes
                // add 0 if value < 10; Example: 2 => 02
                if (hours   < 10) {hours   = "0"+hours;}
                if (minutes < 10) {minutes = "0"+minutes;}
                return hours+':'+minutes; // Return is HH : MM : SS
            }

            await result.map((d:any)=> {
                d.Dte_of_col = dateFormat(d.Dte_of_col, "dd mmm yyyy")
                d.Tme_of_Col = convertHMS(d.Tme_of_Col)
            })

            await Promise.all(result)
            // let body = {
            //     result
            // }
            // let value = ["Testttttttt"]
            // repos = di.get('sql')
            // repos.query(`INSERT INTO PHR_Covid19_Certificate
            // (Lastname) VALUES ('Testttt') `,[value], (err:any, result:any, fields:any) => {
            //     if (err) throw err;
            //     console.log('1111')
            //   });
            // delete axios.defaults.baseURL
            // axios.post(`http://127.0.0.1:30020/api/v1/patient/postpatientlabcovid19`, body)
            // axios.post(`https://phr.samitivejhospitals.com:3000/api/v1/patient/postpatientlabcovid19`, body)
            res.send(result)
            
        }
    }

    getPatientLabCovid19() {
        return async (req : Request, res : Response) => {
            let {labnumber} = req.query
            let repos = di.get('repos')
            repos = di.get("prodlab");
            let result: any = await new Promise((resolve, reject) => {
                repos.reserve((err : any, connObj : any) => {
                    if (connObj) {
                        let conn = connObj.conn;
                        conn.createStatement((err : any, statement : any) => {
                            if (err) {
                                reject(err);
                            } else {
                                statement.setFetchSize(100, function (err : any) {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        const query = `select t1.*,t2.CTTCT_Text as LabResult from
                                        (select
                                        EPVIS_DateOfCollection AS Dte_of_col,  EPVIS_Age, EPVIS_RowId, EPVIS_Species_DR AS EPVIS_Sex, 
                                        case when right(left(EPVIS_HospitalEpisode,3),2) = '11' then 'SVH' else 'SNH' end as Site, 
                                        EPVIS_HospitalEpisode AS EN, EPVIS_DateOfBirth , EPVIS_GivenName AS Gvn_nme,  EPVIS_Surname AS Sur_nme, 
                                        EPVIS_TimeOfCollection AS Tme_of_Col,  EPVIS_TestSets AS Tst_set,  EPVIS_VisitNumber AS LabNumber, 
                                        EPVIS_DebtorNumber_DR AS HN,  EP_VisitTestSet->VISTS_DateOfAuthorisation AS VISTS_Dte_of_aut,  
                                        EP_VisitTestSet->VISTS_TimeOfAuthorisation AS VISTS_Tme_of_aut,  
                                        EP_VisitTestSet->VISTS_UserAuthorised_DR AS VISTS_Usr_aut, EP_VisitTestSet->VISTS_RowId, 
                                        EP_VisitTestSet->VISTS_TestSet_DR->CTTS_Code AS CTTS_Cde, EP_VisitTestSet->VISTS_TestSet_DR->CTTS_Name AS CTTS_Nme,  
                                        EP_VisitTestSet->EP_VisitTestSetData->VISTD_TestData AS TST_DTA,    
                                        EP_VisitTestSet->EP_VisitTestSetData->VISTD_RowId,   
                                        EP_VisitTestSet->EP_VisitTestSetData-> VISTD_TestCode_DR->CTTC_Code AS CTTC_Cde, 
                                        EP_VisitTestSet->EP_VisitTestSetData-> VISTD_TestCode_DR->CTTC_Desc AS CTTC_Des, 
                                        EP_VisitTestSet->EP_VisitTestSetData-> VISTD_TestCode_DR->CTTC_RowId, 
                                        EPVIS_UserID_DR->SSUSR_Name AS SSUSR_Nme,  EPVIS_HospitalCode_DR->CTHOS_Code AS CTHOS_Cde, 
                                        EPVIS_HospitalCode_DR->CTHOS_Name AS CTHOS_Nme, 
                                        EP_VisitTestSet->VISTS_UserAuthorised_DR->SSUSR_Name AS Usr_aut, 
                                        EPVIS_DoctorCode_DR->CTDR_Surname DoctorName,
                                        EP_VisitTestSet->VISTS_UserEntered_DR->SSUSR_Name as Usr_report,
                                        EP_VisitTestSet->VISTS_DateOfEntry as report_date,
                                        EP_VisitTestSet->VISTS_TimeOfEntry as report_time
                                        FROM EP_VisitNumber where EPVIS_VisitNumber = '${labnumber}') t1
                                        left join
                                        SQLUser.CT_TestCodeStandardComm t2
                                        on t2.CTTCT_ParRef = CTTC_RowId and t1.TST_DTA=t2.CTTCT_Code`;
                                        statement.executeQuery(query, function (err : any, resultset : any) {
                                            if (err) {
                                                reject(err);
                                            } else {
                                                resultset.toObjArray(function (err : any, results : any) {
                                                    resolve(results);
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                        repos.release(connObj, function (err : any) {
                            if (err) {
                                console.log(err);
                            }
                        });
                    }
                });
            });
            var dateFormat = require("dateformat");
            

            function convertHMS(value:any) {
                let sec = parseInt(value, 10); // convert value to number if it's string
                sec = sec * 60
                let hours:any   = Math.floor(sec / 3600); // get hours
                let minutes:any = Math.floor((sec - (hours * 3600)) / 60); // get minutes
                // add 0 if value < 10; Example: 2 => 02
                if (hours   < 10) {hours   = "0"+hours;}
                if (minutes < 10) {minutes = "0"+minutes;}
                return hours+':'+minutes; // Return is HH : MM : SS
            }

            await result.map((d:any)=> {
                d.Dte_of_col = dateFormat(d.Dte_of_col, "dd mmm yyyy")
                d.Tme_of_Col = convertHMS(d.Tme_of_Col)
                d.EPVIS_DateOfBirth = dateFormat(d.EPVIS_DateOfBirth, "dd mmm yyyy")
                d.VISTS_Dte_of_aut = dateFormat(d.VISTS_Dte_of_aut, "dd mmm yyyy")
                d.VISTS_Tme_of_aut = convertHMS(d.VISTS_Tme_of_aut)
                d.report_date = dateFormat(d.report_date, "dd mmm yyyy")
                d.report_time = convertHMS(d.report_time)
            })

            await Promise.all(result)
            // let body = {
            //     result
            // }
            // let value = ["Testttttttt"]
            // repos = di.get('sql')
            // repos.query(`INSERT INTO PHR_Covid19_Certificate
            // (Lastname) VALUES ('Testttt') `,[value], (err:any, result:any, fields:any) => {
            //     if (err) throw err;
            //     console.log('1111')
            //   });
            // delete axios.defaults.baseURL
            // axios.post(`http://127.0.0.1:30020/api/v1/patient/postpatientlabcovid19`, body)
            // axios.post(`https://phr.samitivejhospitals.com:3000/api/v1/patient/postpatientlabcovid19`, body)
            res.send(result)
            
        }
    }

    postLogLabCovid19() {
        return async (req : Request, res : Response) => {
            let repos = di.get('cache')

            let result: any = await new Promise((resolve, reject) => {
                repos.reserve((err : any, connObj : any) => {
                    if (connObj) {
                        let conn = connObj.conn;
                        conn.createStatement((err : any, statement : any) => {
                            if (err) {
                                reject(err);
                            } else {
                                statement.setFetchSize(100, function (err : any) {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        const query = `select * from SS_User where SSUSR_RowId = '${req.body[0].UserID}'`;
                                        statement.executeQuery(query, function (err : any, resultset : any) {
                                            if (err) {
                                                reject(err);
                                            } else {
                                                resultset.toObjArray(function (err : any, results : any) {
                                                    resolve(results);
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                        repos.release(connObj, function (err : any) {
                            if (err) {
                                console.log(err);
                            }
                        });
                    }
                });
            });
            await Promise.all(result)
            repos = di.get('repos')
            let log = {
                UserID: req.body[0].UserID,
                UserName: result.length > 0 ? result[0].SSUSR_Name : null,
                Dte_of_col: req.body[0].Dte_of_col,
                EPVIS_Age: req.body[0].EPVIS_Age,
                EPVIS_RowId: req.body[0].EPVIS_RowId,
                EPVIS_Sex: req.body[0].EPVIS_Sex,
                Site: req.body[0].Site,
                EN: req.body[0].EN,
                EPVIS_DateOfBirth: req.body[0].EPVIS_DateOfBirth,
                Gvn_nme: req.body[0].Gvn_nme,
                Sur_nme: req.body[0].Sur_nme,
                Tme_of_Col: req.body[0].Tme_of_Col,
                Tst_set: req.body[0].Tst_set,
                LabNumber: req.body[0].LabNumber,
                HN: req.body[0].HN,
                VISTS_Dte_of_aut: req.body[0].VISTS_Dte_of_aut,
                VISTS_Tme_of_aut: req.body[0].VISTS_Tme_of_aut,
                VISTS_Usr_aut: req.body[0].VISTS_Usr_aut,
                VISTS_RowId: req.body[0].VISTS_RowId,
                CTTS_Cde: req.body[0].CTTS_Cde,
                CTTS_Nme: req.body[0].CTTS_Nme,
                TST_DTA: req.body[0].TST_DTA,
                VISTD_RowId: req.body[0].VISTD_RowId,
                SSUSR_Nme: req.body[0].SSUSR_Nme,
                CTHOS_Cde: req.body[0].CTHOS_Cde,
                CTHOS_Nme: req.body[0].CTHOS_Nme,
                Usr_aut: req.body[0].Usr_aut,
                DoctorName: req.body[0].DoctorName,
                Usr_report: req.body[0].Usr_report,
                report_date: req.body[0].report_date,
                report_time: req.body[0].report_time,
                Location: req.body[0].Location}
            let queryInfo = `INSERT INTO PHR_Covid19_Certificate_Log.PHR_Covid19_Certificate_Log SET ?`
                let insert = await repos.query(queryInfo, log);
                req.body.map(async(d:any)=> {
                let body = {
                    LogID : insert.insertId ,
                    CTTC_Cde : d.CTTC_Cde,
                    CTTC_Des : d.CTTC_Des,
                    LabResult : d.LabResult}
                let queryInfo = `INSERT INTO PHR_Covid19_Certificate_Log.PHR_Covid19_Certificate_LabResult_Log SET ?`
                await repos.query(queryInfo, body);
            })
            res.send([])

        }
    }


    // test() {
    //     return async (req : Request, res : Response) => {
    //         let {identifier, otp, reference} = req.query
    //         delete axios.defaults.baseURL
    //         axios.get(`http://10.105.10.29:1881/verifypatientdata?national_id=1341400135163&passport=null`)
    //     }
    // }

    


}


const router = Router()
const route = new ctRoute()

router
.get("/getpatientlabcovid19", route.getPatientLabCovid19())
.get("/getlabcovid19", route.getLabCovid19())
.post("/postpatientlabcovid19", route.postPatientLabCovid19())
.post("/postloglabcovid19", route.postLogLabCovid19())
.get("/getpatientlablist", route.getPatientLabList())
export const patient = router
