const mysql = require('mysql')
const config = require('../config')
const pool = mysql.createPool({
  connectionLimit: 10,
  host: config.dbHost,
  port: config.dbPort,
  user: config.dbUser,
  password: config.dbPassword,
  database: config.dbName,
  charset: 'utf8mb4'
})

// Rewriting MySQL query method as a promise
const con = {}
con.query = async (query, val) => {
  if (val) {
    const qu = await new Promise((resolve, reject) => {
      pool.query(query, val, (error, results) => {
        if (error) reject(new Error(error))
        resolve(results)
      })
    })
    return qu
  } else {
    const qu = await new Promise((resolve, reject) => {
      pool.query(query, (error, results) => {
        if (error) reject(new Error(error))
        resolve(results)
      })
    })
    return qu
  }
}

module.exports = con
