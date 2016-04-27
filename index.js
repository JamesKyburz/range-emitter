var lpstream = require('length-prefixed-stream')
var duplexify = require('duplexify')
var ltgt = require('ltgt')
var eos = require('end-of-stream')
var messages = require('./messages')

var ENCODERS = {
  'S': messages.Subscribe,
  'U': messages.Unsubscribe,
  'P': messages.Publish
}

var DECODERS = {
  'S': messages.Subscribe,
  'U': messages.Unsubscribe,
  'P': messages.Publish
}

module.exports = Ranges

function Ranges () {
  if (!(this instanceof Ranges)) return new Ranges()
  this._ranges = []
  this._encode = lpstream.encode()
}

Ranges.prototype.subscribe = function (range, cb, resend) {
  if (!resend) {
    if (typeof range === 'string') range = { lte: range, gte: range }
    this._addSubscription(range, cb)
  }
  this._write({
    message: 'S',
    range: range
  })
}

Ranges.prototype.unsubscribe = function (range) {
  this._removeSubscription(range)
  this._write({
    message: 'U',
    range: range
  })
}

Ranges.prototype.publish = function (key, type) {
  this._write({
    message: 'P',
    key: key,
    type: type
  })
}

Ranges.prototype._addSubscription = function (range, cb) {
  this._ranges.push([range, cb])
}

Ranges.prototype.subscriptionExists = function (key) {
  for (var i = 0; i < this._ranges.length; i++) {
    var item = this._ranges[i]
    if (keyInRange(key, item[0])) return true
  }
}

Ranges.prototype.subscriptions = function (key) {
  var callbacks = []
  this._ranges.forEach(function (item) {
    if (keyInRange(key, item[0])) callbacks.push(item[1])
  })
  return callbacks
}

Ranges.prototype.connect = function (opts, proxy) {
  if (this._streaming) throw new Error('Only one rpc stream can be active')
  if (!opts) opts = {}
  proxy = proxy || duplexify()
  var decode = lpstream.decode()
  proxy.setWritable(decode)
  proxy.setReadable(this._encode)

  var self = this

  decode.on('data', function (data) {
    if (!data.length) return
    var tag = String.fromCharCode(data[0])
    var dec = DECODERS[tag]
    if (dec) {
      try {
        var req = dec.decode(data, 1)
      } catch (err) {
        return
      }
      switch (tag) {
        case 'P':
          this.subscriptions(req.key).forEach(function (fn) {
            if (typeof fn === 'function') {
              fn(req.key, req.type)
            }
          })
          break
        case 'S':
          this._addSubscription(req.range)
          break
        case 'U':
          this._removeSubscription(req.range)
          break
      }
    }
  }.bind(this))

  eos(proxy, cleanup)
  this._streaming = proxy
  return proxy

  function cleanup () {
    self._streaming = null
    self._encode = lpstream.encode()
    self._ranges.forEach(function (item) {
      self.subscribe(item[0], item[1], true)
    })
  }
}

Ranges.prototype._removeSubscription = function (range) {
  var i = this._ranges.length
  while (i--) {
    var activeRange = this._ranges[i][0]
    if (rangesEqual(range, activeRange)) {
      this._ranges.splice(i, 1)
    }
  }
}

Ranges.prototype._write = function (req) {
  var enc = ENCODERS[req.message]
  var buf = new Buffer(enc.encodingLength(req) + 1)
  buf[0] = req.message.charCodeAt(0)
  enc.encode(req, buf, 1)
  this._encode.write(buf)
}

function rangesEqual (range1, range2) {
  var keys = ['gt', 'gte', 'lt', 'lte']
  return keys.filter(function (op) {
    return range1[op] === range2[op]
  }).length === keys.length
}

function keyInRange (key, range) {
  return (range.gte === '*' && range.lte === '*') ||
    ltgt.contains(range, key)
}
