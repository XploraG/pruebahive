const stream = require('./helpers/streamBlock')
const mysql = require('./helpers/mysql')

try {
  stream.streamBlockOperations((ops) => {
    if (ops) {
      const op = ops[0]
      if (op && op[0] === 'custom_json' && op[1].id === 'tictactoe') {
        processData(op[1].json, op[1].required_posting_auths)
      }
    }
  })
} catch (e) {
  throw new Error(e)
}

const processData = (jsonData, postingAuths) => {
  try {
    if (!jsonData) {
      return
    }
    const data = JSON.parse(jsonData)
    if (!data || !data.action || !data.app) {
      return
    }
    if (
      !postingAuths ||
      !Array.isArray(postingAuths) ||
      postingAuths.length < 1
    ) {
      return
    }
    const user = postingAuths[0]
    if (data.action === 'create_game') {
      createGame(data, user)
    } else if (data.action === 'request_join') {
      requestJoin(data, user)
    } else if (data.action === 'accept_request') {
      acceptRequest(data, user)
    } else if (data.action === 'play') {
      play(data, user)
    }
  } catch (e) {
    // error might be on JSON.parse and wrong json format
    return null
  }
}

const createGame = async (data, user) => {
  if (!data || !data.id || !data.starting_player) {
    return
  }
  // validating
  if (
    data.id.length !== 20 ||
    (data.starting_player !== 'first' && data.starting_player !== 'second')
  ) {
    return
  }
  // Check already existing games
  const duplicate = await mysql.query(
    'SELECT `id` FROM `games` WHERE `game_id`= ?',
    [data.id]
  )
  if (duplicate && Array.isArray(duplicate) && duplicate.length > 0) {
    return
  }
  // Add game to database
  await mysql.query(
    'INSERT INTO `games`(`game_id`, `player1`, `starting_player`, `status`) VALUES (?, ?, ?, ?)',
    [data.id, user, data.starting_player, 'waiting']
  )
}

const requestJoin = async (data, user) => {
  if (!data || !data.id || !data.id.length !== 20) {
    return
  }
  // Check game id in database
  const game = await mysql.query(
    'SELECT `player1` FROM `games` WHERE `game_id`= ? AND `status`= ?',
    [data.id, 'waiting']
  )
  if (!game || !Array.isArray(game) || game.length < 1) {
    return
  }
  // Players can not play with themselves
  if (game[0].player1 === user) {
    return
  }
  // Check already open requests
  const requests = await mysql.query(
    'SELECT `id` FROM `requests` WHERE `game_id`= ? AND (`player`= ? OR `status`= ?)',
    [data.id, user, 'accepted']
  )
  if (requests && Array.isArray(requests) && requests.length > 0) {
    return
  }
  // Request join game
  await mysql.query(
    'INSERT INTO `requests`(`game_id`, `player`, `status`) VALUES (?, ?, ?)',
    [data.id, user, 'waiting']
  )
}

const acceptRequest = async (data, user) => {
  if (!data || !data.id || !data.player || !data.id.length !== 20) {
    return
  }
  // Validate game in database
  const game = await mysql.query(
    'SELECT `player1` FROM `games` WHERE `game_id`= ? AND `status`= ?',
    [data.id, 'waiting']
  )
  if (!game || !Array.isArray(game) || game.length < 1) {
    return
  }
  const requests = await mysql.query(
    'SELECT `id` FROM `requests` WHERE `game_id`= ? AND `player`= ? AND `status`= ?',
    [data.id, data.player, 'waiting']
  )
  if (!requests || !Array.isArray(requests) || requests.length < 1) {
    return
  }
  // Accept the join request and update game status
  await mysql.query(
    'UPDATE `games` SET `player2`=?,`status`=? WHERE `game_id`=?',
    [data.player, 'running', data.id]
  )
  await mysql.query(
    'UPDATE `requests` SET `status`=? WHERE `game_id`=? AND `player`=?',
    ['accepted', data.id, data.player]
  )
}

const play = (data) => {
  if (
    !data ||
    !data.id ||
    !data.col ||
    !data.row ||
    !data.id.length !== 20 ||
    data.col < 1 ||
    data.col > 3 ||
    data.row < 1 ||
    data.row > 3
  ) {
    return
  }
  // Validate game in database
  // Validate the player round
  // Play game
  console.log('Played game id ' + data.id)
}

console.log('Application started.')
