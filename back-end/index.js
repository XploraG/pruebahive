const stream = require('./helpers/streamBlock')

try {
  stream.streamBlockOperations((ops) => {
    if (ops) {
      const op = ops[0]
      if (op && op[0] === 'custom_json' && op[1].id === 'tictactoe') {
        processData(op[1].json)
      }
    }
  })
} catch (e) {
  throw new Error(e)
}

const processData = (jsonData) => {
  try {
    if (!jsonData) {
      return
    }
    const data = JSON.parse(jsonData)
    if (!data || !data.action || !data.app) {
      return
    }
    if (data.action === 'create_game') {
      createGame(data)
    } else if (data.action === 'request_join') {
      requestJoin(data)
    } else if (data.action === 'accept_request') {
      acceptRequest(data)
    } else if (data.action === 'play') {
      play(data)
    }
  } catch (e) {
    // error might be on JSON.parse and wrong json format
    return null
  }
}

const createGame = (data) => {
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
  // Add game to database
  console.log('Create a game with id ' + data.id)
}

const requestJoin = (data) => {
  if (!data || !data.id || !data.id.length !== 20) {
    return
  }
  // Check game id in database
  // Request join game
  console.log('A player requested to join game id ' + data.id)
}

const acceptRequest = (data) => {
  if (!data || !data.id || !data.player || !data.id.length !== 20) {
    return
  }
  // Validate game in database
  // Accept the join request
  console.log('Accepted join request game id ' + data.id)
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
