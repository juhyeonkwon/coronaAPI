const express = require('express');
const { connection } = require('mongoose');
const mysql2 = require('mysql2/promise');
const router = express.Router();

const dbconfig = require('../dbconfig').dbconfig;


router.get('/', function(req, res) {
    console.log('hi')
    res.send("hihi")
})

router.post('/', function(req, res) {
    console.log(req.body)
    res.send("hihi")
})

router.get('/vaccine', async function(req, res) {

    let sido = req.query.sido;

    let connection = await mysql2.createConnection(dbconfig);

    [rows, fields] = await connection.execute('select * from vaccine_stats_city where sido = ? ORDER BY DATE DESC LIMIT 31', [sido]);

    connection.end()
    
    let ro = rows.reverse();

    res.send(ro);

});

router.get('/vaccine/all', async function(req, res) {


    let connection = await mysql2.createConnection(dbconfig);

    [rows, fields] = await connection.execute('select * from vaccine_stats_city ORDER BY DATE DESC LIMIT 558');

    
    connection.end()
    
    let ro = await rows.reverse();

    let arr = await setData(ro);

    async function setData(ro) {
        let arr = [];
        let temp = [];
        let k = 0;
        for (let i = 0; i < ro.length; i++) {
            if (k !== 18) {
                temp.push(ro[i]);
            } else {
                arr.push(temp);
                temp = [];
                temp.push(ro[i]);
                k=1;
                continue;
            }
            k++;
        }
        return arr;
    }

    res.send(arr);

});

router.get('/infection', async function(req, res) {


    let connection = await mysql2.createConnection(dbconfig);

    //[rows, fields] = await connection.execute("SELECT * FROM infection_stats");
    [rows, fields] = await connection.execute("SELECT * FROM infection_stats_city ORDER BY stat_idx desc limit 19");

    connection.end();

    res.send(rows);

});

router.get('/infection/city', async function(req, res) {

    let sido = req.query.sido;

    let connection = await mysql2.createConnection(dbconfig);

    [rows, fields] = await connection.execute("SELECT * FROM infection_stats_city where sido = ? ", [sido]);

    await connection.end();

    res.send(rows)
})


module.exports = router;
