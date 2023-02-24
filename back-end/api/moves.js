const mysql = require('../helpers/mysql')
const express = require('express')
const router = express.Router()

router.get('/moves/:id', async (req, res) => {
  try {
    if (!req.params.id) {
      res.json({
        id: 0,
        error: 'Expected game_id.'
      })
    }
    const moves = await mysql.query(
      'SELECT `player`, `col`, `row` FROM `moves` WHERE `game_id`= ?',
      [req.params.id]
    )
    if (!moves || !Array.isArray(moves) || moves.length < 1) {
      return res.json({
        id: 1,
        moves: []
      })
    }
    return res.json({
      id: 1,
      moves
    })
  } catch (e) {
    res.json({
      id: 0,
      error: 'Unexpected error.'
    })
  }
})

module.exports = router
