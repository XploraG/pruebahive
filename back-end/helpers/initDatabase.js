const mysql = require('./mysql')

/**
 * id, game_id, player1, player2, starting_player, status, winner
 */
const tableGames =
  'CREATE TABLE IF NOT EXISTS `tictactoe`.`games` ( `id` INT NOT NULL AUTO_INCREMENT , ' +
  '`game_id` TINYTEXT NOT NULL , ' +
  '`player1` TINYTEXT NOT NULL , `player2` TINYTEXT NULL DEFAULT NULL , ' +
  '`starting_player` TINYTEXT NOT NULL , `status` TINYTEXT NULL , ' +
  '`winner` TINYTEXT NULL DEFAULT NULL , PRIMARY KEY  (`id`)) ' +
  'ENGINE = InnoDB CHARSET=utf8mb4 COLLATE utf8mb4_general_ci;'

/**
 * id, game_id, player, col, row
 */
const tableMoves =
  'CREATE TABLE IF NOT EXISTS `tictactoe`.`moves` ( `id` INT NOT NULL AUTO_INCREMENT , ' +
  '`game_id` TINYTEXT NOT NULL , `player` TINYTEXT NOT NULL , ' +
  '`col` INT(1) NOT NULL , `row` INT(1) NOT NULL , ' +
  'PRIMARY KEY  (`id`)) ENGINE = InnoDB CHARSET=utf8mb4 COLLATE utf8mb4_general_ci;'

const tableRquests =
  'CREATE TABLE IF NOT EXISTS `tictactoe`.`requests` ( `id` INT NOT NULL AUTO_INCREMENT , ' +
  '`game_id` TINYTEXT NOT NULL , `player` TINYTEXT NOT NULL , `status` TINYTEXT NOT NULL , ' +
  'PRIMARY KEY  (`id`)) ENGINE = InnoDB CHARSET=utf8mb4 COLLATE utf8mb4_general_ci;'

const initDatabase = async () => {
  await mysql.query(tableGames)
  await mysql.query(tableMoves)
  await mysql.query(tableRquests)
}

module.exports = initDatabase
