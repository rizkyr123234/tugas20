const express = require('express')
const sqlite = require('sqlite3').verbose()
const bodyParser = require('body-parser')
const path = require('path')
const moment = require('moment')
var app = express()
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
const port = 3000
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
let db = new sqlite.Database('./tugas20.db', sqlite.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message)
    console.log('berhasil')
}
)
app.get('/', (req, res) => {
    const url = req.url == '/' ? '/?page=1' : req.url // buat nge bug kalo pengen balik lagi 
    const page = req.query.page || 1
   
    console.log(page,'ini pagenya')
    const limit = 3 // limit tuh buat nampilin bebebrapa data saja 
    const offset = (page - 1) * limit // rumus buat nyari offset dari mas rubi 
    const wheres = []
    const values = []
    
    //pencarian 
    if(req.query.id){
        wheres.push(`ID = ?`)
        values.push(parseInt(req.query.id))
    }
    if (req.query.nama) {
        wheres.push(`Nama like '%' || ? || '%' `) // trik buat like 
        values.push(req.query.nama)
    }

    if (req.query.tinggi) {
        wheres.push(` Tinggi = ? `)
        values.push(parseInt(req.query.tinggi))

    }

    if (req.query.berat) {
        wheres.push(` berat_badan =? `)
        values.push(parseInt(req.query.berat))

    }

    if (req.query.status) {
        const status = req.query.status == 'nikah'? 1 : 0
        wheres.push(` status_menikah=?`)
        values.push(status)
       
    }
    if(req.query.date && req.query.date2 ){
        wheres.push(` tanggal_lahir BETWEEN ? AND ?`)
        values.push(req.query.date,req.query.date2)
    }
     else if(req.query.date){
        wheres.push(` tanggal_lahir >?`)
        values.push(req.query.date)
    } else if(req.query.date2){
        wheres.push(` tanggal_lahir <?`)
        values.push(req.query.date2)
    }
   
   

    let sqlC = `select count(*) AS total from tugas20 `
    if (wheres.length > 0) {
        sqlC += ` WHERE ${wheres.join(' and ')}`
    }

    console.log(sqlC, 'ini yg pertama')
    db.all(sqlC,values, (err, rows) => {
        const pages = Math.ceil(rows[0].total / limit)

        sqlC = `select * from tugas20 `
        if (wheres.length > 0) {
            sqlC += `WHERE ${wheres.join(' and')}`
        }
        sqlC += ' LIMIT ? OFFSET ?'
        values.push(limit,offset)
        console.log(values,'ini value')
        console.log(sqlC)
        db.all(sqlC, values, (err, rows) => {
          //console.log('ini yg ada limitnya', sqlC)
            if (err) return 'gagal mas '
            res.render('menu', { rows, pages, page, moment, url,query:req.query})
        })
    })
})

app.get('/tambah', (req, res) => {
    res.render('tambah')
})

app.post('/tambah', (req, res) => {
    if (req.body.status == 'nikah') {
        req.body.status = 1
    } else { req.body.status = 0 }
    let status = req.body.status
    let berat = parseInt(req.body.berat)
    let tinggi = parseInt(req.body.tinggi)
    let date = req.body.date
    let nama = req.body.nama
    db.run(`INSERT INTO tugas20
(Nama, tinggi, tanggal_lahir,status_menikah,berat_badan) values
(?, ?, ?,?,?)`, [nama, tinggi, date, status, berat], err => {
        if (err) console.error(err.message)
    })
    res.redirect('/')
})

app.get('/delet/:id', (req, res) => {
    const index = req.params.id
    db.run(`DELETE from tugas20 WHERE ID =? `, [index], err => {
        if (err) console.error(err.message)
    })
    res.redirect('/')
})

app.get('/edit/:id', (req, res) => {
    db.all(`select * from tugas20 WHERE ID=?`,[req.params.id], (err, rows) => {
        if (err) return 'gagal mas '
        console.log(rows)
        res.render('edit', { item: rows[0]})

        app.post('/edit/:id', (req, res) => {
            let id = parseInt(req.body.id)
            let nama = req.body.nama
            let tinggi = parseInt(req.body.tinggi)
            let date = req.body.date
            let status = req.body.status
            let berat = parseInt(req.body.berat)
            if (req.body.status == 'menikah') {
                status = 1
            } else { status = 0 }

            db.run(`UPDATE tugas20 SET
    Nama = ?, tinggi = ?, tanggal_lahir=?, status_menikah = ?, berat_badan =? 
    WHERE ID =${id}`,
                [nama, tinggi, date, status, berat])
            res.redirect('/')
        })
    })
})

app.listen(port, () => {
    console.log(`tersambung ${port}`)
})