// Options reference: https://pm2.keymetrics.io/docs/usage/application-declaration/
module.exports = {
  apps: [
    {
      name: 'app-tictactoe',
      script: 'index.js',
      instances: 1,
      max_memory_restart: '1G',
      exec_mode: 'fork'
    },
    {
      name: 'api-tictactoe',
      script: 'api/server.js',
      instances: 2,
      max_memory_restart: '1G',
      exec_mode: 'cluster'
    }
  ]
}
