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
  res.header(
    'Access-Control-Allow-Origin',
    'http://localhost https://tic-tac-toe.mahdiyari.info/'
  )
  res.header('Access-Control-Allow-Credentials', true)
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, access_key'
  )
  next()
})

const port = process.env.PORT || 2021
const host = process.env.HOST || '127.0.0.1'
app.listen(port, host, () => {
  console.log(`Application started on ${host}:${port}`)
})
