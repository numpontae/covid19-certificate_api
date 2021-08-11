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





    // postPatientLabCovid19() {
    //     return async (req : Request, res : Response) => {
    //         let repos = di.get('sql')
    //         let queryDelete = `DELETE PHR_Covid19_Certificate WHERE LabNumber = '${req.body.result[0].LabNumber}'`
    //         await repos.query(queryDelete);
    //         req.body.result.map(async(d:any)=> {
    //             let queryInfo = `INSERT INTO PHR_Covid19_Certificate
    //         (Dte_of_col, EPVIS_Age, EPVIS_RowId, EPVIS_Sex, EN, EPVIS_DateOfBirth, 
    //         Gvn_nme, Sur_nme, Tme_of_Col, Tst_set, LabNumber, HN, VISTS_Dte_of_aut, VISTS_Tme_of_aut, 
    //         VISTS_Usr_aut, VISTS_RowId, CTTS_Cde, CTTS_Nme, TST_DTA, VISTD_RowId, CTTC_Cde, CTTC_Des, 
    //         CTTC_RowId, SSUSR_Nme, CTHOS_Cde, CTHOS_Nme, Usr_aut, LabResult)
    //           VALUES('${d.Dte_of_col}', '${d.EPVIS_Age}', '${d.EPVIS_RowId}', '${d.EPVIS_Sex}', '${d.EN}', '${d.EPVIS_DateOfBirth}'
    //           , '${d.Gvn_nme}', '${d.Sur_nme}', '${d.Tme_of_Col}', '${d.Tst_set}', '${d.LabNumber}', '${d.HN}', '${d.VISTS_Dte_of_aut}', '${d.VISTS_Tme_of_aut}'
    //           , '${d.VISTS_Usr_aut}', '${d.VISTS_RowId}', '${d.CTTS_Cde}', '${d.CTTS_Nme}', '${d.TST_DTA}', '${d.VISTD_RowId}', '${d.CTTC_Cde}', '${d.CTTC_Des}'
    //           , '${d.CTTC_RowId}', '${d.SSUSR_Nme}', '${d.CTHOS_Cde}', '${d.CTHOS_Nme}', '${d.Usr_aut}', '${d.LabResult}');
    //           `
    //             await repos.query(queryInfo);
    //         })
    //         res.send([])

    //     }
    // }

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
                                        EPVIS_DateOfCollection AS Dte_of_col,  EPVIS_Age, EPVIS_RowId, EPVIS_Species_DR AS EPVIS_Sex, EPVIS_HospitalEpisode AS EN, EPVIS_DateOfBirth , EPVIS_GivenName AS Gvn_nme,  EPVIS_Surname AS Sur_nme, EPVIS_TimeOfCollection AS Tme_of_Col,  EPVIS_TestSets AS Tst_set,  EPVIS_VisitNumber AS LabNumber, 
                                        EPVIS_DebtorNumber_DR AS HN,  EP_VisitTestSet->VISTS_DateOfAuthorisation AS VISTS_Dte_of_aut,  EP_VisitTestSet->VISTS_TimeOfAuthorisation AS VISTS_Tme_of_aut,  
                                        EP_VisitTestSet->VISTS_UserAuthorised_DR AS VISTS_Usr_aut, EP_VisitTestSet->VISTS_RowId, EP_VisitTestSet->VISTS_TestSet_DR->CTTS_Code AS CTTS_Cde, EP_VisitTestSet->VISTS_TestSet_DR->CTTS_Name AS CTTS_Nme,  EP_VisitTestSet->EP_VisitTestSetData->VISTD_TestData AS TST_DTA,    
                                        EP_VisitTestSet->EP_VisitTestSetData->VISTD_RowId,   EP_VisitTestSet->EP_VisitTestSetData-> VISTD_TestCode_DR->CTTC_Code AS CTTC_Cde, EP_VisitTestSet->EP_VisitTestSetData-> VISTD_TestCode_DR->CTTC_Desc AS CTTC_Des, EP_VisitTestSet->EP_VisitTestSetData-> VISTD_TestCode_DR->CTTC_RowId, 
                                        EPVIS_UserID_DR->SSUSR_Name AS SSUSR_Nme,  EPVIS_HospitalCode_DR->CTHOS_Code AS CTHOS_Cde, EPVIS_HospitalCode_DR->CTHOS_Name AS CTHOS_Nme,   EP_VisitTestSet->VISTS_UserAuthorised_DR->SSUSR_Name AS Usr_aut
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
            })

            await Promise.all(result)
            let body = {
                result
            }
            // let value = ["Testttttttt"]
            // repos = di.get('sql')
            // repos.query(`INSERT INTO PHR_Covid19_Certificate
            // (Lastname) VALUES ('Testttt') `,[value], (err:any, result:any, fields:any) => {
            //     if (err) throw err;
            //     console.log('1111')
            //   });
            delete axios.defaults.baseURL
            axios.post(`https://phr.samitivejhospitals.com:3000/api/v1/patient/postpatientlabcovid19`, body)
            res.send(result)
            
        }
    }


    test() {
        return async (req : Request, res : Response) => {
            let {identifier, otp, reference} = req.query
            delete axios.defaults.baseURL
            axios.get(`http://10.105.10.29:1881/verifypatientdata?national_id=1341400135163&passport=null`)
        }
    }

    


}


const router = Router()
const route = new ctRoute()

router
.get("/getpatientlabcovid19", route.getPatientLabCovid19())
// .post("/postpatientlabcovid19", route.postPatientLabCovid19())
export const patient = router
