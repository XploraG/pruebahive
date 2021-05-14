const baseAPI = 'http://127.0.0.1:2021'
if (hiveTx.config) {
  hiveTx.config.node = 'https://api.ha.deathwing.me'
}
const userData = {
  authorized: false,
  username: '',
  key: ''
}
let movesData
let gameData
const computedMoves = new Array(9)
let round = ''
let oldRound = ''
const updateState = () => {
  const loginButton = document.getElementById('login-button')
  const logoutMenu = document.getElementById('logout-menu')
  const usernameButton = document.getElementById('username-button')
  if (userData.authorized && userData.username && userData.key) {
    loginButton.style.display = 'none'
    logoutMenu.style.display = 'block'
    usernameButton.innerHTML = '@' + userData.username
  } else {
    loginButton.style.display = 'block'
    logoutMenu.style.display = 'none'
  }
}

const validatePostingKey = async (username, privateKey) => {
  const accounts = await hiveTx.call('condenser_api.get_accounts', [[username]])
  if (
    !accounts ||
    !accounts.result ||
    !Array.isArray(accounts.result) ||
    accounts.result.length < 1
  ) {
    return { result: 0, error: 'Network error or wrong username' }
  }
  try {
    const account = accounts.result[0]
    const publicWif = account.posting.key_auths[0][0] || ''
    const generatedPublicKey = hiveTx.PrivateKey.from(privateKey)
      .createPublic()
      .toString()

    if (generatedPublicKey !== publicWif) {
      return { result: 0, error: 'Wrong key' }
    }
    return { result: 1 }
  } catch (e) {
    return { result: 0, error: 'Wrong key or network error' }
  }
}

const login = async () => {
  const loginModal = bootstrap.Modal.getInstance(
    document.getElementById('login-modal')
  )
  const loginButtonForm = document.getElementById('login-form-btn')
  loginButtonForm.setAttribute('disabled', 'true')
  const loginError = document.getElementById('login-error')
  loginError.style.display = 'none'
  const username = document.getElementById('username').value
  const key = document.getElementById('posting-key').value
  const validate = await validatePostingKey(username, key)
  if (validate.result === 0) {
    loginError.innerHTML = validate.error
    loginError.style.display = 'block'
    loginButtonForm.removeAttribute('disabled')
    return
  }
  userData.authorized = true
  userData.username = username
  userData.key = key
  window.localStorage.setItem('userData', JSON.stringify(userData))
  loginButtonForm.removeAttribute('disabled')
  updateState()
  loginModal.hide()
}

const logout = () => {
  userData.authorized = false
  userData.username = ''
  userData.key = ''
  window.localStorage.removeItem('userData')
  updateState()
}

const checkState = () => {
  const localData = window.localStorage.getItem('userData')
  let data
  if (!localData) {
    return
  }
  try {
    data = JSON.parse(localData)
  } catch (e) {
    data = userData
  }
  if (data.authorized && data.username && data.key) {
    userData.authorized = true
    userData.username = data.username
    userData.key = data.key
    updateState()
  }
}
checkState()

const APICall = async api => {
  return (await fetch(baseAPI + api)).json()
}

const getGames = async (page = 1) => {
  const games = await APICall('/games/' + page)
  return games.games
}

const fillGamesTable = data => {
  const tbody = document.getElementById('games-table-body')
  let temp = ''
  for (let i = 0; i < data.length; i++) {
    temp += `<tr>
    <td>${(gamesPage - 1) * 10 + i + 1}</td>
    <td><a href="game.html?id=${data[i].game_id}">${data[i].game_id}</a></td>
    <td>${makeUserLink(data[i].player1)}</td>
    <td>${data[i].player2 !== null ? makeUserLink(data[i].player2) : '...'}</td>
    <td>${data[i].starting_player}</td>
    <td>${data[i].status}</td>
    <td>${data[i].winner !== null ? data[i].winner : '...'}</td>
    <td><a href="game.html?id=${
      data[i].game_id
    }" class="btn btn-secondary">View</a></td>
    </tr>`
  }
  if (data.length < 1) {
    temp = 'No games.'
  }
  tbody.innerHTML = temp
}

let gamesPage = 1
const loadTheGames = async () => {
  const games = await getGames(gamesPage)
  fillGamesTable(games)
  if (games.length < 10) {
    document.getElementById('next-btn').className = 'page-item disabled'
  } else {
    document.getElementById('next-btn').className = 'page-item'
  }
  if (gamesPage === 1) {
    document.getElementById('prev-btn').className = 'page-item disabled'
  } else {
    document.getElementById('prev-btn').className = 'page-item'
  }
  document.getElementById('page-number').innerHTML = ` ${gamesPage} `
}

const nextGamesPage = () => {
  gamesPage++
  loadTheGames()
}

const prevGamesPage = () => {
  gamesPage--
  loadTheGames()
}

const random = (length = 20) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let str = ''
  for (let i = 0; i < length; i++) {
    str += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return str
}

const createGame = async () => {
  if (!userData.authorized) {
    document.getElementById('login-button').click()
    return
  }
  const button = document.getElementById('create-game-btn')
  button.setAttribute('disabled', 'true')
  const errorOutput = document.getElementById('create-game-error')
  const successOutput = document.getElementById('create-game-success')
  errorOutput.innerHTML = ''
  successOutput.innerHTML = ''
  loading(true)
  try {
    const id = random(20)
    const game = {
      app: 'tictactoe/0.0.1',
      action: 'create_game',
      id,
      starting_player: document.getElementById('starting-player').value
    }
    const operations = [
      [
        'custom_json',
        {
          required_auths: [],
          required_posting_auths: [userData.username],
          id: 'tictactoe',
          json: JSON.stringify(game)
        }
      ]
    ]
    const tx = new hiveTx.Transaction()
    await tx.create(operations)
    const privateKey = hiveTx.PrivateKey.from(userData.key)
    tx.sign(privateKey)
    const result = await tx.broadcast()
    if (result && result.result && result.result.block_num) {
      successOutput.innerHTML =
        'Success! <a href="game.html?id=' + id + '">Click to see</a>'
    } else {
      errorOutput.innerHTML =
        'Error! Check console for details. Press Ctrl+Shift+J'
      console.error(result)
    }
  } catch (e) {
    errorOutput.innerHTML =
      'Error! Check console for details. Press Ctrl+Shift+J'
    console.error(e)
  }
  loading(false)
  button.removeAttribute('disabled')
}

// The below codes are mostly for game.html

const getGameDetails = async id => {
  const data = await APICall('/game/' + id)
  if (data && data.id === 0) {
    document.getElementById('details-error').innerHTML = data.error
  } else if (data && data.id === 1) {
    const game = data.game[0]
    document.getElementById('player1').innerHTML = makeUserLink(game.player1)
    document.getElementById('player2').innerHTML =
      game.player2 !== null ? makeUserLink(game.player2) : '...'
    document.getElementById('status').innerHTML = game.status
    document.getElementById('winner').innerHTML = game.winner
    document.getElementById('starting-player').innerHTML = game.starting_player
    if (game.player1 === userData.username) {
      document.getElementById('req-message-1').style.display = 'block'
      document.getElementById('req-message-2').style.display = 'none'
      document.getElementById('join-card').style.display = 'none'
      getRequests(id, game.status, true)
    } else {
      getRequests(id, game.status, false)
    }
    if (game.status !== 'waiting') {
      document.getElementById('join-card').style.display = 'none'
      document.getElementById('waiting-join').style.display = 'none'
      document.getElementById('game-canvas').style.display = 'initial'
      if (game.status === 'finished') {
        document.getElementById('game-finished').style.display = 'block'
      }
    } else {
      document.getElementById('waiting-join').style.display = 'block'
      document.getElementById('game-canvas').style.display = 'none'
    }
    getMoves(id)
    gameData = game
  }
}

const makeUserLink = user => {
  return `<a href="https://hiveblocks.com/@${user}" target="_blank" rel="noopener nofollow noreferrer">@${user}</a>`
}

const getRequests = async (id, status, creator = false) => {
  const data = await APICall('/requests/' + id)
  if (data && data.id === 0) {
    document.getElementById('requests-error').innerHTML = data.error
  } else if (data && data.id === 1) {
    let temp = ''
    for (let i = 0; i < data.requests.length; i++) {
      const request = data.requests[i]
      temp += `<tr>
        <td>${request.player}</td>
        <td>${request.status}</td>`
      if (creator && status === 'waiting') {
        // Add an Accept button if the visitor is player1 (creator)
        temp += `<td>
          <button class="btn btn-primary" onclick="acceptRequest('${id}', '${request.player}')">
            Accept
          </button>
        </td>`
      } else {
        temp += '<td>---</td>'
      }
      temp += '</tr>'
      if (request.player === userData.username) {
        document.getElementById('join-card').style.display = 'none'
      }
    }
    if (data.requests.length < 1) {
      temp = 'None'
    }
    document.getElementById('request-list').innerHTML = temp
  }
}

const getMoves = async id => {
  const data = await APICall('/moves/' + id)
  if (data && data.id === 0) {
    document.getElementById('moves-error').innerHTML = data.error
  } else if (data && data.id === 1) {
    let temp = ''
    for (let i = 0; i < data.moves.length; i++) {
      const move = data.moves[i]
      temp += `<tr>
        <td>${move.player}</td>
        <td>(${move.col}, ${move.row})</td>
        </tr>`
    }
    if (data.moves.length < 1) {
      temp = 'None'
    }
    document.getElementById('moves-list').innerHTML = temp
    movesData = data.moves
    computeMoves()
    // enable play button for round..
    if (oldRound && oldRound === round) {
      round = oldRound
      return
    }
    oldRound = ''
    if (gameData.status === 'finished' || gameData.status === 'waiting') {
      toggleMoveInteractions('hide-all')
    } else if (round === 'first' && gameData.player1 === userData.username) {
      toggleMoveInteractions('player-moving')
    } else if (round === 'second' && gameData.player2 === userData.username) {
      toggleMoveInteractions('player-moving')
    } else if (round === 'first' && gameData.player2 === userData.username) {
      toggleMoveInteractions('player-waiting')
    } else if (round === 'second' && gameData.player1 === userData.username) {
      toggleMoveInteractions('player-waiting')
    } else if (
      userData.username !== gameData.player1 &&
      userData.username !== gameData.player2 &&
      gameData.status === 'running'
    ) {
      toggleMoveInteractions('waiting-all')
    } else {
      toggleMoveInteractions('hide-all')
    }
  }
}

const toggleMoveInteractions = type => {
  const yourTurn = document.getElementById('your-turn')
  const submitMoveBtn = document.getElementById('submit-move-btn')
  const waitingOther = document.getElementById('waiting-other')
  const waitingAll = document.getElementById('waiting-all')
  if (type === 'player-moving') {
    yourTurn.style.display = 'block'
    submitMoveBtn.style.display = 'initial'
    waitingOther.style.display = 'none'
    waitingAll.style.display = 'none'
  } else if (type === 'player-waiting') {
    yourTurn.style.display = 'none'
    submitMoveBtn.style.display = 'none'
    waitingOther.style.display = 'block'
    waitingAll.style.display = 'none'
  } else if (type === 'waiting-all') {
    yourTurn.style.display = 'none'
    submitMoveBtn.style.display = 'none'
    waitingOther.style.display = 'none'
    waitingAll.style.display = 'block'
  } else if (type === 'hide-all') {
    yourTurn.style.display = 'none'
    submitMoveBtn.style.display = 'none'
    waitingOther.style.display = 'none'
    waitingAll.style.display = 'none'
  }
}

const computeMoves = () => {
  if (!movesData || !gameData) {
    setTimeout(() => computeMoves(), 100)
    return
  }
  clearMoves()
  for (let i = 0; i < movesData.length; i++) {
    const move = movesData[i]
    let mark
    if (move.player === gameData.player1) {
      mark = 'x'
    } else if (move.player === gameData.player2) {
      mark = 'o'
    } else {
      continue
    }
    placeMark(move.col, move.row, mark)
  }
  placeMark(userMove[0], userMove[1], userMove[2])
  if (movesData.length < 1) {
    round = gameData.starting_player
  } else if (movesData[movesData.length - 1].player === gameData.player1) {
    round = 'second'
  } else {
    round = 'first'
  }
}

const queryString = window.location.search
const urlParams = new URLSearchParams(queryString)

// Run the script only in homepage
if (!window.location.pathname.match(/game.html$/)) {
  loadTheGames()
  setInterval(() => loadTheGames(), 5000)
} else {
  // Run the script only in game page
  if (urlParams.has('id')) {
    getGameDetails(urlParams.get('id'))
    setInterval(() => getGameDetails(urlParams.get('id')), 1500)
  }
}

const acceptRequest = async (id, player) => {
  const success = document.getElementById('requests-success')
  const error = document.getElementById('requests-error')
  if (!userData.username) {
    return
  }
  loading(true)
  try {
    const accept = {
      app: 'tictactoe/0.0.1',
      action: 'accept_request',
      id,
      player
    }
    const operations = [
      [
        'custom_json',
        {
          required_auths: [],
          required_posting_auths: [userData.username],
          id: 'tictactoe',
          json: JSON.stringify(accept)
        }
      ]
    ]
    const tx = new hiveTx.Transaction()
    await tx.create(operations)
    const privateKey = hiveTx.PrivateKey.from(userData.key)
    tx.sign(privateKey)
    const result = await tx.broadcast()
    if (result && result.result && result.result.block_num) {
      success.innerHTML = 'Success! Game started.'
      setTimeout(() => getGameDetails(urlParams.get('id')), 1500)
    } else {
      error.innerHTML = 'Error! Check console for details. Press Ctrl+Shift+J'
      console.error(result)
    }
  } catch (e) {
    error.innerHTML = 'Error! Check console for details. Press Ctrl+Shift+J'
    console.error(e)
  }
  loading(false)
}

const joinGame = async gameId => {
  if (!userData.authorized) {
    document.getElementById('login-button').click()
    return
  }
  const success = document.getElementById('join-success')
  const error = document.getElementById('join-error')
  if (!urlParams.has('id')) {
    return
  }
  loading(true)
  const id = urlParams.get('id')
  try {
    const joinReq = {
      app: 'tictactoe/0.0.1',
      action: 'request_join',
      id
    }
    const operations = [
      [
        'custom_json',
        {
          required_auths: [],
          required_posting_auths: [userData.username],
          id: 'tictactoe',
          json: JSON.stringify(joinReq)
        }
      ]
    ]
    const tx = new hiveTx.Transaction()
    await tx.create(operations)
    const privateKey = hiveTx.PrivateKey.from(userData.key)
    tx.sign(privateKey)
    const result = await tx.broadcast()
    if (result && result.result && result.result.block_num) {
      success.innerHTML = 'Success! Your request submitted.'
      setTimeout(() => getGameDetails(urlParams.get('id')), 1500)
    } else {
      error.innerHTML = 'Error! Check console for details. Press Ctrl+Shift+J'
      console.error(result)
    }
  } catch (e) {
    error.innerHTML = 'Error! Check console for details. Press Ctrl+Shift+J'
    console.error(e)
  }
  loading(false)
}

const loading = toggle => {
  const load = document.getElementById('loading')
  if (toggle) {
    load.style.display = 'block'
  } else {
    load.style.display = 'none'
  }
}

const submitMove = async () => {
  if (!userData.authorized) {
    document.getElementById('login-button').click()
    return
  }
  if (!userMove || userMove.length < 2) {
    return
  }
  if (!urlParams.has('id')) {
    return
  }
  const error = document.getElementById('submit-move-error')
  error.innerHTML = ''
  loading(true)
  const id = urlParams.get('id')
  try {
    const play = {
      app: 'tictactoe/0.0.1',
      action: 'play',
      id,
      col: userMove[0],
      row: userMove[1]
    }
    const operations = [
      [
        'custom_json',
        {
          required_auths: [],
          required_posting_auths: [userData.username],
          id: 'tictactoe',
          json: JSON.stringify(play)
        }
      ]
    ]
    const tx = new hiveTx.Transaction()
    await tx.create(operations)
    const privateKey = hiveTx.PrivateKey.from(userData.key)
    tx.sign(privateKey)
    const result = await tx.broadcastNoResult()
    if (result && result.result && result.result.tx_id) {
      setTimeout(() => getGameDetails(urlParams.get('id')), 1500)
      oldRound = round
      round = round === 'first' ? 'second' : 'first'
      toggleMoveInteractions('player-waiting')
    } else {
      error.innerHTML = 'Error! Check console for details. Press Ctrl+Shift+J'
      console.error(result)
    }
  } catch (e) {
    error.innerHTML = 'Error! Check console for details. Press Ctrl+Shift+J'
    console.error(e)
  }
  loading(false)
}
