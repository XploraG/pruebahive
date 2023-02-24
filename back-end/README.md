Valid operation structures:

Create a game
```js
{
  app: 'tictactoe/0.0.1'
  action: 'create_game',
  id: 'Random generated id',
  starting_player: 'first or second'
}
```

Request join a game
```js
{
  app: 'tictactoe/0.0.1',
  action: 'request_join',
  id: 'Game id'
}
```

Accept join request
```js
{
  app: 'tictactoe/0.0.1',
  action: 'accept_request',
  id: 'Game id',
  player: 'username'
}
```

Play
```js
{
  app: 'tictactoe/0.0.1',
  action: 'play',
  id: 'Game id',
  col: '1 to 3',
  row: '1 to 3'
}
```


