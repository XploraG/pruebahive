const mysql = require('../helpers/mysql')
const express = require('express')
const router = express.Router()

router.get('/games/:page', async (req, res) => {
  try {
    if (isNaN(req.params.page)) {
      res.json({
        id: 0,
        error: 'Expected number.'
      })
    }
    const page = Math.floor(req.params.page)
    if (page < 1) {
      res.json({
        id: 0,
        error: 'Expected > 0'
      })
    }
    const offset = (page - 1) * 10
    const games = await mysql.query(
      'SELECT `game_id`, `player1`, `player2`, `starting_player`, `status`, `winner` FROM `games`' +
        ' ORDER BY `id` DESC LIMIT 10 OFFSET ?',
      [offset]
    )
    if (!games || !Array.isArray(games) || games.length < 1) {
      return res.json({
        id: 1,
        games: []
      })
    }
    return res.json({
      id: 1,
      games
    })
  } catch (e) {
    res.json({
      id: 0,
      error: 'Unexpected error.'
    })
  }
})

module.exports = router
