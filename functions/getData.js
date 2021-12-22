const cron = require('node-cron');
const request = require('request');
const convert = require('xml-js')
const mysql = require('mysql');

//mysql dbconfig
const dbconfig = {
    host : "192.168.0.21",
    user: "root",
    password: "root!",
    database: "corona",
}


module.exports = {
    getVaccineData : function () {
        //스케줄링 데이터가 9시 3분에 갱신되기 때문에 9시 5분에 데이터를 가져와서 DB에 저장을 하는 스케줄링을 만듬
        //2021.11.04 9시 5분에 갱신이 안됐음....
        cron.schedule("5 10 * * *", () => {
            
            //request 모듈을 통해서 백신접종자 수를 가져옵니다. 
            request.get({
                headers : {'User-Agent' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'},             //user-agent를 넣지 않을 경우 크롤링이나 디도스로 인식하는거 같아서 넣어줌.
                url : 'https://nip.kdca.go.kr/irgd/cov19stats.do?list=all',
                port: 443,
                method : "GET"
            }, async (err, response, body) => {
                let json = JSON.parse(convert.xml2json(body, {compact : true, spacces : 4}))          
            
                const data = {
                    today : {
                        first : json.response.body.items.item[0].firstCnt._text,
                        second : json.response.body.items.item[0].secondCnt._text,
                        third : json.response.body.items.item[0].thirdCnt._text,
                    },
                    yesterday : {
                        first : json.response.body.items.item[1].firstCnt._text,
                        second : json.response.body.items.item[1].secondCnt._text,
                        third : json.response.body.items.item[1].thirdCnt._text,
                    },
                    all : {
                        first : json.response.body.items.item[2].firstCnt._text,
                        second : json.response.body.items.item[2].secondCnt._text,
                        third : json.response.body.items.item[2].thirdCnt._text,
                    }
                }


                //가져온 데이터를 DB에 저장하는 코드
                let connection = mysql.createConnection(dbconfig);

                connection.connect();

                const SQL = "INSERT INTO vaccine_stats(today_first,today_second, today_third, yesterday_first,yesterday_second, yesterday_third, all_first,all_second, all_third, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"

                let today = new Date();
                let month = today.getMonth()+1

                const param = [ 
                    data.today.first,
                    data.today.second,
                    data.today.third,
                    data.yesterday.first,
                    data.yesterday.second,
                    data.yesterday.third,
                    data.all.first,
                    data.all.second,
                    data.all.third,
                    today.getFullYear() + '-' + month + '-' + today.getDate()
                ]
                connection.query(SQL, param, function(err, results, fields) {
                    if(err) {
                        console.log('db 쿼리중 에러 발생')
                        console.log(err)
                    } else {
                        console.log('일일 백신 현황 불러오기 완료')
                    }
                });

                connection.end();                
            })
        }).start()
    },
    //각 도시별 백신접종 수를 가져옵니다. (1차, 2차, 부스터 샷)
    getVaccineCityData : function() {
      
       cron.schedule("5 10 * * *", () => {

            /* 파라미터, url 정리 */
            let url = 'https://api.odcloud.kr/api/15077756/v1/vaccine-stat?'

            let date = new Date();
            let month = date.getMonth() + 1
            let day = date.getDate();

            if(day < 10) {
                day = '0' + date.getDate();
            }

            let paramDate = date.getFullYear() + '-' + month + '-' + day + encodeURIComponent(' 00:00:00')
         
            let param = encodeURI('page') + '=1';
            param += '&' + encodeURIComponent('perPage') + '=18';
            param += '&' + encodeURIComponent('cond[baseDate::EQ]') + '=' + paramDate;
            param += '&' + encodeURIComponent('serviceKey') + '=' + 'f07kNaBvNTS%2FVHWxNplYgJJpu%2B75KQARZURTpNtwE7PAjA0hFZfmY6k9iX3QDVB2ux6%2BMulcWogEeXF5OSWIHQ%3D%3D'

            request.get({
                headers : {
                    'User-Agent' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36',
                    'Authorization' : 'https://infuser.odcloud.kr/oas/docs?namespace=15077756/v1'
                },
                url : url + param,
                port: 443,
                method : "GET"   
            }, async (error, response, body) => {
                let jsonbody = JSON.parse(body)
                let data = jsonbody.data;

                let connection = mysql.createConnection(dbconfig);

                let SQL = 'INSERT INTO vaccine_stats_city(first, second, third, total_first, total_second, total_third, sido, date) values (?, ?, ?, ?, ?, ?, ?, ?)'

                let today = new Date();
                let month = today.getMonth()+1

                for(let i = 0 ; i < data.length; i++) {
                    let param = [
                        data[i].firstCnt,
                        data[i].secondCnt,
                        data[i].thirdCnt,
                        data[i].totalFirstCnt,
                        data[i].totalSecondCnt,
                        data[i].totalThirdCnt,
                        data[i].sido,
                        data[i].baseDate.slice(0,10),
                    ];

                    connection.query(SQL, param, function(err, results, fields) {
                        if(err) {
                            console.log(err);
                        } else {
                            console.log(param + "도시별 백신 현황 DB Insert Done.");
                        }
                    });
                }

                connection.end();

            });
      }).start();
    },
    //코로나 감염현황을 조회합니다.
    getCovid19InfState : function() {
       cron.schedule('5 10 * * * ', () => {

            let date = new Date()
            let month = date.getMonth() + 1;
            if(month < 10) {
                month = "0" + month; 
            }

            let day = date.getDate();
            
            if(day < 10) {
                day = "0"+ day;
            }
            
            let today = date.getFullYear() + "" + month + "" + day;
            let url = 'http://openapi.data.go.kr/openapi/service/rest/Covid19/getCovid19InfStateJson';
            let queryParams = '?' + encodeURIComponent('serviceKey') + '=f07kNaBvNTS%2FVHWxNplYgJJpu%2B75KQARZURTpNtwE7PAjA0hFZfmY6k9iX3QDVB2ux6%2BMulcWogEeXF5OSWIHQ%3D%3D'
            queryParams += '&' + encodeURIComponent('pageNo') + '=' + encodeURIComponent('1')
            queryParams += '&' + encodeURIComponent('numOfRows') + '=' + encodeURIComponent('180');
            queryParams += '&' + encodeURIComponent('startCreateDt') + '=' + encodeURIComponent(today); 
            queryParams += '&' + encodeURIComponent('endCreateDt') + '=' + encodeURIComponent(today); 
    
            request.get({
                headers : {'User-Agent' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'},
                url : url + queryParams,
                method : "GET"        
            }, async (error, response, body) => {    
                
                let bodyJson = JSON.parse(convert.xml2json(body, {compact : true, spacces : 4}))
                let param = bodyJson.response.body.items.item
    
                const connection = mysql.createConnection(dbconfig);

                let params = [                    
                    param.stateDt._text.slice(0, 4) + "-" + param.stateDt._text.slice(4,6)+ "-" + param.stateDt._text.slice(6,),
                    param.decideCnt._text,
                    param.clearCnt._text,
                    param.examCnt._text,
                    param.deathCnt._text,
                    param.careCnt._text,
                    param.resutlNegCnt._text,
                    param.accExamCnt._text,
                    param.accExamCompCnt._text,
                    param.accDefRate._text                       
                ]            


                let SQL = "INSERT INTO infection_stats(state_date, decide_cnt, clear_cnt, exam_cnt, death_cnt, care_cnt, result_neg_cnt, acc_exam_cnt, acc_exam_comp_cnt, acc_def_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"          

                connection.query(SQL, params, function(err, results, fields) {
                    if(err) {
                        console.log(err)
                    } else {
                        console.log('코로나 감염 현황 데이터 삽입 완료' + params)
                    }
                });
                
    
                connection.end();
          })   
       }).start();
    },
    //도시별 확진자 수를 조회합니다람쥐
    getCovidCityInfState : function() {
         cron.schedule("5 10 * * * ", () => {
            let date = new Date()
            let month = date.getMonth() + 1;
            if(month < 10) {
                month = "0" + month; 
            }
    
            let day = date.getDate();
            
            if(day < 10) {
                day = "0"+ day;
            }
            let today = date.getFullYear() + "" + month + "" + day;
            let url = 'http://openapi.data.go.kr/openapi/service/rest/Covid19/getCovid19SidoInfStateJson';
            let queryParams = '?' + encodeURIComponent('serviceKey') + '=f07kNaBvNTS%2FVHWxNplYgJJpu%2B75KQARZURTpNtwE7PAjA0hFZfmY6k9iX3QDVB2ux6%2BMulcWogEeXF5OSWIHQ%3D%3D'
            queryParams += '&' + encodeURIComponent('pageNo') + '=' + encodeURIComponent('1')
            queryParams += '&' + encodeURIComponent('numOfRows') + '=' + encodeURIComponent('19');
            queryParams += '&' + encodeURIComponent('startCreateDt') + '=' + encodeURIComponent(today); 
            queryParams += '&' + encodeURIComponent('endCreateDt') + '=' + encodeURIComponent(today); 
    
    
            request.get({
                headers : {'User-Agent' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'},
                url: url + queryParams,
                method : 'GET'            
            }, (error, response, body) => {
                let bodyJson = JSON.parse(convert.xml2json(body, {compact : true, spacces : 4}))
                let param = bodyJson.response.body.items.item.reverse();
                console.log(param)
    
                let connection = mysql.createConnection(dbconfig);
    
                for(let i = 0 ; i < param.length; i++) {
                    if(param[i].qurRate._text === '-') {
                        param[i].qurRate._text = 0;
                    }
                    let params = [                    
                        param[i].createDt._text,
                        param[i].deathCnt._text,
                        param[i].gubun._text,
                        param[i].gubunCn._text,
                        param[i].gubunEn._text,
                        param[i].incDec._text,
                        param[i].isolClearCnt._text,
                        parseFloat(param[i].qurRate._text), 
                        param[i].stdDay._text,
                        param[i].defCnt._text,
                        param[i].overFlowCnt._text,
                        param[i].localOccCnt._text,                  
                    ]                
    
                    let SQL = "INSERT INTO infection_stats_city( create_dt, death_cnt, sido, sido_cn, sido_en, inc_dec, isol_clear_cnt, qur_rate, std_day, def_cnt, over_flow_cnt, local_occ_cnt) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"          
    
                    connection.query(SQL, params, function(err, results, fields) {
                        if(err) {
                            console.log(err)
                        } else {
                            console.log('데이터 삽입 완료' + params)
                        }
                    });
                }    
                connection.end();    
            });
         }).start();

    }
}





/*

CREATE TABLE `corona`.`vaccine_stats` (
  `stat_idx` INT NOT NULL AUTO_INCREMENT,
  `today_first` INT NOT NULL,
  `today_second` INT NOT NULL,
  `yesterday_first` INT NOT NULL,
  `yesterday_second` INT NOT NULL,
  `all_first` INT NOT NULL,
  `all_second` INT NOT NULL,
  `date` DATE NOT NULL,
  PRIMARY KEY (`stat_idx`));


  CREATE TABLE `corona`.`vaccine_stats_city` (
  `stat_idx` INT NOT NULL AUTO_INCREMENT,
  `first` INT NULL,
  `second` INT NULL,
  `third` INT NULL,
  `total_first` INT NULL,
  `total_second` INT NULL,
  `total_third` INT NULL,
  `sido` VARCHAR(20) NULL,
  `date` DATE NULL,
  PRIMARY KEY (`stat_idx`));


  */