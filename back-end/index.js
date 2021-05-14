const stream = require('./helpers/streamBlock')
const mysql = require('./helpers/mysql')
const checkWinningMark = require('./helpers/checkWinningMark')
const initDatabase = require('./helpers/initDatabase')
const rapidQueue = require('./helpers/rapidQueue')

const queue = rapidQueue.createQueue()

// The game launch block - don't change
const genesisBlock = 53886076
let firstRun = true
let totalSyncedBlocks = 0

const start = async () => {
  try {
    await initDatabase()
    stream.streamBlockNumber(async blockNum => {
      if (!blockNum) {
        return
      }
      if (firstRun) {
        firstRun = false
        await queueOldBlocks(blockNum)
      }
      queue.push(blockNum)
    })
    processQueue()
  } catch (e) {
    throw new Error(e)
  }
}

const queueOldBlocks = async nowBlock => {
  let oldestBlock
  const latestBlock = await mysql.query(
    'SELECT `block_number` FROM `lastblock` WHERE `id`=1'
  )
  if (latestBlock[0].block_number === 0) {
    oldestBlock = genesisBlock
  } else {
    oldestBlock = latestBlock[0].block_number
  }
  if (oldestBlock < nowBlock) {
    for (let i = oldestBlock; i < nowBlock; i++) {
      queue.push(i)
    }
  }
}

const intervalTime = 5 // 50ms
const maxI = 1
let queueIndex = 0
const processQueue = () => {
  setInterval(() => {
    const L = queue.length()
    if (queueIndex < maxI && L > 0) {
      const n = maxI - queueIndex > L ? L : maxI - queueIndex
      for (let k = 0; k < n; k++) {
        const blockNum = queue.shift()
        processBlock(blockNum)
      }
    }
  }, intervalTime)
}

const processBlock = async blockNum => {
  if (!blockNum) {
    return
  }
  queueIndex++
  try {
    const operations = await stream.getOperations(blockNum)
    if (operations && operations.length > 0) {
      for (const ops of operations) {
        for (const op of ops) {
          if (op && op[0] === 'custom_json' && op[1].id === 'tictactoe') {
            await processData(op[1].json, op[1].required_posting_auths)
          }
        }
      }
    }
    await updateLastblock(blockNum)
    totalSyncedBlocks++
  } catch (e) {}
  queueIndex--
}

const updateLastblock = async blockNum => {
  if (!blockNum) {
    return
  }
  await mysql.query('UPDATE `lastblock` SET `block_number`=? WHERE `id`=1', [
    blockNum
  ])
}

const processData = async (jsonData, postingAuths) => {
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
      await createGame(data, user)
    } else if (data.action === 'request_join') {
      await requestJoin(data, user)
    } else if (data.action === 'accept_request') {
      await acceptRequest(data, user)
    } else if (data.action === 'play') {
      await play(data, user)
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
  if (!data || !data.id || data.id.length !== 20) {
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
  if (!data || !data.id || !data.player || data.id.length !== 20) {
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

const play = async (data, user) => {
  if (
    !data ||
    !data.id ||
    !data.col ||
    !data.row ||
    isNaN(data.col) ||
    isNaN(data.row) ||
    data.id.length !== 20 ||
    data.col < 1 ||
    data.col > 3 ||
    data.row < 1 ||
    data.row > 3
  ) {
    return
  }
  // Validate game in database
  const game = await mysql.query(
    'SELECT `player1`, `player2`, `starting_player` FROM `games` WHERE `game_id`= ? AND `status`= ? AND (player1=? OR player2=?)',
    [data.id, 'running', user, user]
  )
  if (!game || !Array.isArray(game) || game.length < 1) {
    return
  }
  // Validate the player round
  let round = ''
  const computedMoves = new Array(9)
  const moves = await mysql.query(
    'SELECT `player`, `col`, `row` FROM `moves` WHERE `game_id`= ? ORDER BY `id` ASC',
    [data.id]
  )
  if (!moves || !Array.isArray(moves) || moves.length < 1) {
    round = game[0].starting_player
  } else {
    if (moves[moves.length - 1].player === game[0].player1) {
      round = 'second'
    } else {
      round = 'first'
    }
  }
  if (moves.length > 8) {
    return
  }
  if (round === 'first' && game[0].player2 === user) {
    return
  }
  if (round === 'second' && game[0].player1 === user) {
    return
  }
  // Play game and check winner
  await mysql.query(
    'INSERT INTO `moves`(`game_id`, `player`, `col`, `row`) VALUES (?,?,?,?)',
    [data.id, user, data.col, data.row]
  )
  moves.push({ player: user, col: data.col, row: data.row })
  for (let i = 0; i < moves.length; i++) {
    const move = moves[i]
    let mark
    if (move.player === game[0].player1) {
      mark = 'x'
    } else if (move.player === game[0].player2) {
      mark = 'o'
    } else {
      continue
    }
    if (move.row === 1) {
      computedMoves[move.col - 1] = mark
    } else if (move.row === 2) {
      computedMoves[move.col + 2] = mark
    } else if (move.row === 3) {
      computedMoves[move.col + 5] = mark
    }
  }
  checkWinner(computedMoves, data.id)
}

const checkWinner = async (computedMoves, id) => {
  if (checkWinningMark(computedMoves, 'x')) {
    await mysql.query(
      'UPDATE `games` SET `status`=?, `winner`=? WHERE `game_id`=?',
      ['finished', 'player1', id]
    )
  } else if (checkWinningMark(computedMoves, 'o')) {
    await mysql.query(
      'UPDATE `games` SET `status`=?, `winner`=? WHERE `game_id`=?',
      ['finished', 'player2', id]
    )
  } else {
    for (let i = 0; i < 9; i++) {
      if (!computedMoves[i]) {
        return
      }
    }
    await mysql.query(
      'UPDATE `games` SET `status`=?, `winner`=? WHERE `game_id`=?',
      ['finished', 'none', id]
    )
  }
}

start()
console.log('Tic Tac Toe Application')
console.log(
  'Starting application... It is highly recommended to use a local node for syncing blocks otherwise it might take too long.'
)
const interval = setInterval(() => {
  if (queue.length() < 2) {
    clearInterval(interval)
    console.log('Sync completed. Application is running.')
  } else {
    console.log('Syncing blocks... Total synced blocks: ' + totalSyncedBlocks)
  }
}, 5000)
