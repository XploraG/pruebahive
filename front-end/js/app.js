const userData = {
  authorized: false,
  username: '',
  key: ''
}

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

const baseAPI = 'http://127.0.0.1:2021'
const APICall = async (api) => {
  return (await fetch(baseAPI + api)).json()
}

const getGames = async (page = 1) => {
  const games = await APICall('/games/' + page)
  return games.games
}

const fillGamesTable = (data) => {
  const tbody = document.getElementById('games-table-body')
  let temp = ''
  for (let i = 0; i < data.length; i++) {
    temp += `<tr>
    <td>${(gamesPage - 1) * 10 + i + 1}</td>
    <td>${data[i].game_id}</td>
    <td>${data[i].player1}</td>
    <td>${data[i].player2}</td>
    <td>${data[i].starting_player}</td>
    <td>${data[i].status}</td>
    <td>${data[i].winner}</td>
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
  const button = document.getElementById('create-game-btn')
  button.setAttribute('disabled', 'true')
  const errorOutput = document.getElementById('create-game-error')
  const successOutput = document.getElementById('create-game-success')
  errorOutput.innerHTML = ''
  successOutput.innerHTML = ''
  try {
    const game = {
      app: 'tictactoe/0.0.1',
      action: 'create_game',
      id: random(20),
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
        'Success! <a href="link to game">Click to see</a>'
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
  button.removeAttribute('disabled')
}

// The below codes are mostly for game.html

const getGameDetails = async (id) => {
  const data = await APICall('/game/' + id)
  if (data && data.id === 0) {
    document.getElementById('details-error').innerHTML = data.error
  } else if (data && data.id === 1) {
    const game = data.game[0]
    document.getElementById('game-details').innerHTML = `<tr>
      <td>${game.player1}</td>
      <td>${game.player2}</td>
      <td>${game.starting_player}</td>
      <td>${game.status}</td>
      <td>${game.winner}</td>
    </tr>`
    if (game.player1 === userData.username) {
      document.getElementById('req-message-1').style.display = 'block'
      document.getElementById('req-message-2').style.display = 'none'
      getRequests(id, true)
    } else {
      getRequests(id, false)
    }
  }
}

const getRequests = async (id, creator = false) => {
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
      if (creator) {
        // Add an Accept button if the visitor is player1 (creator)
        temp += `<td>
          <button class="btn btn-primary" onclick="acceptRequest(${id}, ${request.player})">
            Accept
          </button>
        </td>`
      } else {
        temp += '<td>---</td>'
      }
      temp += '</tr>'
    }
    if (data.requests.length < 1) {
      temp = 'None'
    }
    document.getElementById('request-list').innerHTML = temp
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
    setInterval(() => getGameDetails(urlParams.get('id')), 5000)
  }
}

const acceptRequest = async (id, player) => {
  const success = document.getElementById('requests-success')
  const error = document.getElementById('requests-error')
  if (!userData.username) {
    return
  }
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
    } else {
      error.innerHTML = 'Error! Check console for details. Press Ctrl+Shift+J'
      console.error(result)
    }
  } catch (e) {
    error.innerHTML = 'Error! Check console for details. Press Ctrl+Shift+J'
    console.error(e)
  }
}

const joinGame = async (gameId) => {
  const success = document.getElementById('join-success')
  const error = document.getElementById('join-error')
  if (!urlParams.has('id')) {
    return
  }
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
    } else {
      error.innerHTML = 'Error! Check console for details. Press Ctrl+Shift+J'
      console.error(result)
    }
  } catch (e) {
    error.innerHTML = 'Error! Check console for details. Press Ctrl+Shift+J'
    console.error(e)
  }
}
