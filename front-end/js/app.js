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
    <td></td>
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
loadTheGames()
setInterval(() => loadTheGames(), 5000)

const nextGamesPage = () => {
  gamesPage++
  loadTheGames()
}

const prevGamesPage = () => {
  gamesPage--
  loadTheGames()
}
