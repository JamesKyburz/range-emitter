var Emitter = require('./')
var client = Emitter()
var server = Emitter()

var clientStream = client.connect()
var serverStream = server.connect()

clientStream.pipe(serverStream).pipe(clientStream)

client.subscribe({ lt: 5, gte: 1 }, (key) => {
  console.log('match key is %s', key)
})
    //client.unsubscribe({ lt: '5', gte: '2' })

process.nextTick(function () {
  console.log('server has 3?', server.subscriptionExists(3))
  console.log('server has 4?', server.subscriptionExists(4))
  console.log('server has 5?', server.subscriptionExists(5))

  process.nextTick(function () {
    ;['7', '0', '1', '2', '3', '4', '5', '6'].forEach(function (i) {
      server.publish(i)
    })
    ;['7', '0', '1', '2', '3', '4', '5', '6'].forEach(function (i) {
      server.publish(i)
    })
  })
})
