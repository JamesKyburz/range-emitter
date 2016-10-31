var test = require('tape')
var Emitter = require('./')

function setup(cb) {
  var client = Emitter()
  var server = Emitter()

  var clientStream = client.connect()
  var serverStream = server.connect()

  clientStream.pipe(serverStream).pipe(clientStream)
  cb(client, server)
}

test('should setup subscription', function (t) {
  t.plan(1)
  setup(function (client, server) {
    client.subscribe({ gte: '5' })
    process.nextTick(function () {
      t.equal(server.subscriptionExists(5), true)
    })
  })
})

test('should match any key', function (t) {
  t.plan(1)
  setup(function (client, server) {
    client.subscribe((key, type) => {
      t.equal(key, 'any')
    })
    server.publish('any', 'put')
  })
})

test('should match key equal to 5', function (t) {
  t.plan(1)
  setup(function (client, server) {
    client.subscribe({ gte: '5' }, (key, type) => {
      t.equal(key, '5')
    })
    server.publish('5', 'put')
  })
})

test('should not match key less than 5', function (t) {
  t.plan(1)
  setup(function (client, server) {
    client.subscribe({ gte: '5' }, (key, type) => {
      t.equal(key, '5')
    })
    server.publish('3', 'put')
    server.publish('5', 'put')
  })
})
