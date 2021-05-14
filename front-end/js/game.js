const initialize = () => {
  const canvas = document.getElementById('game-canvas')
  const ctx = canvas.getContext('2d')
  ctx.beginPath()
  ctx.moveTo(130, 0)
  ctx.lineTo(130, 390)
  ctx.moveTo(260, 0)
  ctx.lineTo(260, 390)
  ctx.moveTo(0, 130)
  ctx.lineTo(390, 130)
  ctx.moveTo(0, 260)
  ctx.lineTo(390, 260)
  ctx.stroke()
}
const drawX = (ctx, x, y, size, width) => {
  // Start at the top left corner and draw an X
  ctx.beginPath()
  x -= size
  y -= size
  ctx.moveTo(x, y)
  x += width / 2
  y -= width / 2
  ctx.lineTo(x, y)
  x += size
  y += size
  ctx.lineTo(x, y)
  x += size
  y -= size
  ctx.lineTo(x, y)
  x += width / 2
  y += width / 2
  ctx.lineTo(x, y)
  x -= size
  y += size
  ctx.lineTo(x, y)
  x += size
  y += size
  ctx.lineTo(x, y)
  x -= width / 2
  y += width / 2
  ctx.lineTo(x, y)
  x -= size
  y -= size
  ctx.lineTo(x, y)
  x -= size
  y += size
  ctx.lineTo(x, y)
  x -= width / 2
  y -= width / 2
  ctx.lineTo(x, y)
  x += size
  y -= size
  ctx.lineTo(x, y)
  x -= size
  y -= size
  ctx.lineTo(x, y)
  ctx.closePath()
  ctx.fill()
}

initialize()

let userMove = []
const movesObject = {}
const clickCanvas = e => {
  if (
    (round === 'first' && userData.username === gameData.player1) ||
    (round === 'second' && userData.username === gameData.player2)
  ) {
    let mark
    if (round === 'first') {
      mark = 'x'
    } else {
      mark = 'o'
    }
    movesObject['' + userMove[0] + userMove[1]] = null
    userMove = []
    clearMoves()
    computeMoves()
    const canvas = document.getElementById('game-canvas')
    const mouseX = e.pageX - canvas.offsetLeft - canvas.offsetParent.offsetLeft
    const mouseY = e.pageY - canvas.offsetTop - canvas.offsetParent.offsetTop
    if (mouseX < 130) {
      if (mouseY < 130) {
        // col =1 and row=1 (1, 1)
        if (!movesObject['11']) {
          placeMark(1, 1, mark)
          userMove = [1, 1, mark]
        }
      } else if (mouseY < 260) {
        if (!movesObject['12']) {
          placeMark(1, 2, mark)
          userMove = [1, 2, mark]
        }
      } else if (mouseY < 390) {
        if (!movesObject['13']) {
          placeMark(1, 3, mark)
          userMove = [1, 3, mark]
        }
      }
    } else if (mouseX < 260) {
      if (mouseY < 130) {
        if (!movesObject['21']) {
          placeMark(2, 1, mark)
          userMove = [2, 1, mark]
        }
      } else if (mouseY < 260) {
        if (!movesObject['22']) {
          placeMark(2, 2, mark)
          userMove = [2, 2, mark]
        }
      } else if (mouseY < 390) {
        if (!movesObject['23']) {
          placeMark(2, 3, mark)
          userMove = [2, 3, mark]
        }
      }
    } else if (mouseX < 390) {
      if (mouseY < 130) {
        if (!movesObject['31']) {
          placeMark(3, 1, mark)
          userMove = [3, 1, mark]
        }
      } else if (mouseY < 260) {
        if (!movesObject['32']) {
          placeMark(3, 2, mark)
          userMove = [3, 2, mark]
        }
      } else if (mouseY < 390) {
        if (!movesObject['33']) {
          placeMark(3, 3, mark)
          userMove = [3, 3, mark]
        }
      }
    }
    if (userMove.length > 2) {
      document.getElementById('submit-move-btn').removeAttribute('disabled')
    } else {
      document
        .getElementById('submit-move-btn')
        .setAttribute('disabled', 'true')
    }
  }
}
document.getElementById('game-canvas').addEventListener('mouseup', clickCanvas)

let i = 1
const placeMark = (col, row, mark) => {
  const canvas = document.getElementById('game-canvas')
  const ctx = canvas.getContext('2d')
  const x = 65 * (2 * col - 1)
  const y = 65 * (2 * row - 1)
  if (mark === 'o') {
    ctx.beginPath()
    ctx.fillStyle = '#e31337'
    ctx.arc(x, y, 40, 0, 2 * Math.PI)
    ctx.fill()
  } else {
    ctx.fillStyle = 'rgb(46, 92, 219)'
    drawX(ctx, x - 20, y, 20, 40)
  }
  movesObject['' + col + row] = mark
  i++
}

const clearMoves = () => {
  const canvas = document.getElementById('game-canvas')
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  initialize()
}
