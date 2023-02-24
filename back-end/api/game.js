const mysql = require('../helpers/mysql')
const express = require('express')
const router = express.Router()

router.get('/game/:id', async (req, res) => {
  try {
    const id = req.params.id
    if (!id || id.length !== 20 || !id.match(/^[a-zA-Z0-9]+$/)) {
      return res.json({
        id: 0,
        error: 'Wrong id.'
      })
    }
    const game = await mysql.query(
      'SELECT `game_id`, `player1`, `player2`, `starting_player`, `status`, `winner` FROM `games`' +
        'WHERE `game_id`=?',
      [id]
    )
    if (!game || !Array.isArray(game) || game.length < 1) {
      return res.json({
        id: 1,
        game: []
      })
    }
    return res.json({
      id: 1,
      game
    })
  } catch (e) {
    return res.json({
      id: 0,
      error: 'Unexpected error.'
    })
  }
})

module.exports = router
