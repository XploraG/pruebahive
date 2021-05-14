const checkWinningMark = (computedMoves, mark) => {
  if (computedMoves[0] === mark) {
    if (computedMoves[1] === mark && computedMoves[2] === mark) {
      return true
    }
    if (computedMoves[3] === mark && computedMoves[6] === mark) {
      return true
    }
    if (computedMoves[4] === mark && computedMoves[8] === mark) {
      return true
    }
  }
  if (computedMoves[1] === mark) {
    if (computedMoves[4] === mark && computedMoves[7] === mark) {
      return true
    }
  }
  if (computedMoves[2] === mark) {
    if (computedMoves[5] === mark && computedMoves[8] === mark) {
      return true
    }
  }
  if (computedMoves[3] === mark) {
    if (computedMoves[4] === mark && computedMoves[5] === mark) {
      return true
    }
  }
  if (computedMoves[6] === mark) {
    if (computedMoves[7] === mark && computedMoves[8] === mark) {
      return true
    }
    if (computedMoves[4] === mark && computedMoves[2] === mark) {
      return true
    }
  }
  return false
}

module.exports = checkWinningMark
