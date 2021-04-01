const express = require('express')
const bodyParser = require('body-parser')
const hpp = require('hpp')
const helmet = require('helmet')
const app = express()

// more info: www.npmjs.com/package/hpp
app.use(hpp())
app.use(helmet())

// support json encoded bodies and encoded bodies
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use(function (req, res, next) {
  const allowedOrigins = [
    'http://localhost',
    'https://tic-tac-toe.mahdiyari.info/'
  ]
  const origin = req.headers.origin
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin)
  }
  res.header('Access-Control-Allow-Credentials', true)
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, access_key'
  )
  next()
})

// APIs
const games = require('./games')
const requests = require('./requests')
const moves = require('./moves')

app.use(games)
app.use(requests)
app.use(moves)

const port = process.env.PORT || 2021
const host = process.env.HOST || '127.0.0.1'
app.listen(port, host, () => {
  console.log(`Application started on ${host}:${port}`)
})
