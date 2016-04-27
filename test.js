var Emitter = require('./')
var client = Emitter()
var server = Emitter()

var clientStream = client.connect()
var serverStream = server.connect()

clientStream.pipe(serverStream).pipe(clientStream)

client.subscribe({ gte: '5' }, (key, type) => {
  console.log('match any key is %s', key, type)
})
//client.subscribe({ gte: '3', lte: '5' }, (key) => {
//  console.log('match key is %s', key)
//})
//
//client.subscribe({ gte: '0', lte: '7' }, (key) => {
//  console.log('match key is %s', key)
//})
//
//client.unsubscribe({ gte: '0', lte: '7' })

process.nextTick(function () {
  console.log('server has 3?', server.subscriptionExists(3))
  console.log('server has 4?', server.subscriptionExists(4))
  console.log('server has 5?', server.subscriptionExists(5))

  process.nextTick(function () {
    ;['7', '0', '1', '2', '3', '4', '5', '6'].forEach(function (i) {
      if (client.subscriptionExists(i)) {
        //server.publish(i, { put: true })
        server.publish(i, 'put')
      }
    })
    server.publish('8', 'del')
  })
})
