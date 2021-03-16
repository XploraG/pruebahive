const hiveTx = require('hive-tx')

const INTERVAL_TIME = 1000

const streamBlockNumber = async (cb) => {
  try {
    let lastBlock = 0
    setInterval(async () => {
      const gdgp = await hiveTx.call(
        'condenser_api.get_dynamic_global_properties'
      )
      if (
        gdgp &&
        gdgp.result &&
        gdgp.result.head_block_number &&
        !isNaN(gdgp.result.head_block_number)
      ) {
        if (gdgp.result.head_block_number > lastBlock) {
          lastBlock = gdgp.result.head_block_number
          cb(lastBlock)
        }
      }
    }, INTERVAL_TIME)
  } catch (e) {
    throw new Error(e)
  }
}

const streamBlockOperations = async (cb) => {
  try {
    streamBlockNumber(async (blockNumber) => {
      const result = await hiveTx.call('condenser_api.get_block', [blockNumber])
      if (result.result) {
        const operations = result.result.transactions.map((transaction) => {
          return transaction.operations
        })
        if (operations.length > 0) {
          for (const operation of operations) {
            cb(operation)
          }
        }
      }
    })
  } catch (e) {
    throw new Error(e)
  }
}

module.exports = {
  streamBlockNumber,
  streamBlockOperations
}
