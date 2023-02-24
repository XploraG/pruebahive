const mysql = require('../helpers/mysql')
const express = require('express')
const router = express.Router()

router.get('/requests/:id', async (req, res) => {
  try {
    if (!req.params.id) {
      res.json({
        id: 0,
        error: 'Expected game_id.'
      })
    }
    // We are passing user input into the database
    // You should be careful in such cases
    // We use ? for parameters which escapes the characters
    const requests = await mysql.query(
      'SELECT `player`, `status` FROM `requests` WHERE `game_id`= ?',
      [req.params.id]
    )
    if (!requests || !Array.isArray(requests) || requests.length < 1) {
      return res.json({
        id: 1,
        requests: []
      })
    }
    return res.json({
      id: 1,
      requests
    })
  } catch (e) {
    res.json({
      id: 0,
      error: 'Unexpected error.'
    })
  }
})

module.exports = router
