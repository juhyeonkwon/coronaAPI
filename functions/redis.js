const { json } = require("express");
const redis = require("redis");
const request = require('request');
const convert = require('xml-js');

const client = redis.createClient({
    host : '192.168.0.21',
    port : 6379,
    password : '1234'
});

client.on("error", (error) => {
    console.error(error);
})


module.exports = {
    getInfectionData : function() {
        // let date = new Date()
        // let month = date.getMonth() + 1;
        // if(month < 10) {
        //     month = "0" + month; 
        // }

        // let day = date.getDate();
        
        // if(day < 10) {
        //     day = "0"+ day;
        // }
        // let today = date.getFullYear() + "" + month + "" + day;
        // let url = 'http://openapi.data.go.kr/openapi/service/rest/Covid19/getCovid19SidoInfStateJson';
        // let queryParams = '?' + encodeURIComponent('serviceKey') + '=f07kNaBvNTS%2FVHWxNplYgJJpu%2B75KQARZURTpNtwE7PAjA0hFZfmY6k9iX3QDVB2ux6%2BMulcWogEeXF5OSWIHQ%3D%3D'
        // queryParams += '&' + encodeURIComponent('pageNo') + '=' + encodeURIComponent('1')
        // queryParams += '&' + encodeURIComponent('numOfRows') + '=' + encodeURIComponent('19');
        // queryParams += '&' + encodeURIComponent('startCreateDt') + '=' + encodeURIComponent(20210101); 
        // queryParams += '&' + encodeURIComponent('endCreateDt') + '=' + encodeURIComponent(today); 


        // request.get({
        //     headers : {'User-Agent' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'},
        //     url: url + queryParams,
        //     method : 'GET'            
        // }, (error, response, body) => {
        //     let bodyJson = JSON.parse(convert.xml2json(body, {compact : true, spacces : 4}))
        //     let param = bodyJson.response.body.items.item.reverse();
        //     client.AUTH('1234', function(err, reply) {

        //         for(let i = 0 ; i < param.length; i++) {
        //             client.LPUSH("infection", JSON.stringify(param[i]));
        //         }                    
        //     });
        // });
        
        // client.AUTH('1234', function(err, reply) {
    
        //     client.set("abc", "123123", redis.print);

        //     client.LPUSH("infection", "ㅇㅅㅇ");
        // })
    },
    printabc : function() {
        client.AUTH('1234', function(err, reply) {
             client.get("abc", function(err, reply) {
                 console.log(reply)
            })

            client.lrange("infection", 0, 1, function(err, reply) {
                for(let i = 0 ; i < reply.length; i++) {
                    console.log(JSON.parse(reply[i]))
                }
            })
    
        })
    }

        
}



