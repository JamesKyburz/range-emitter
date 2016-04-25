var lpstream = require('length-prefixed-stream')
var duplexify = require('duplexify')
var ltgt = require('ltgt')
var eos = require('end-of-stream')
var messages = require('./messages')
var levelCodec = require('level-codec')

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

function Ranges (keyEncoding) {
  if (!(this instanceof Ranges)) return new Ranges(keyEncoding)
  this._ranges = []
  this.codec = new levelCodec(keyEncoding || 'utf8')
  this._encode = lpstream.encode()
}

Ranges.prototype.subscribe = function (range, cb) {
  range = this._encodeRange(range)
  this._addSubscription(range, cb)
  this._write({
    message: 'S',
    range: range
  })
}

Ranges.prototype._addSubscription = function (range, cb) {
  this._ranges.push([this._encodeRange(range), cb])
}

Ranges.prototype.unsubscribe = function (range) {
  this._removeSubscription(range)
  this._write({
    message: 'U',
    range: range
  })
}

Ranges.prototype._removeSubscription = function (range) {
  range = this._encodeRange(range)
  var i = this._ranges.length
  while (i--) {
    var activeRange = this._ranges[i][0]
    if (rangesEqual(range, activeRange)) {
      this._ranges.splice(i, 1)
    }
  }
}

Ranges.prototype.publish = function (key, encoding) {
  this._write({
    message: 'P',
    key: this.codec.encodeKey(key)
  })
}

Ranges.prototype._write = function (req) {
  var enc = ENCODERS[req.message]
  var buf = new Buffer(enc.encodingLength(req) + 1)
  buf[0] = req.message.charCodeAt(0)
  enc.encode(req, buf, 1)
  this._encode.write(buf)
}

Ranges.prototype.subscriptionExists = function (key) {
  for (var i = 0; i < this._ranges.length; i++) {
    var item = this._ranges[i]
    if (ltgt.contains(item[0], key)) return true
  }
}

Ranges.prototype.subscriptions = function (key) {
  var callbacks = []
  this._ranges.forEach(function (item) {
    if (ltgt.contains(item[0], this.codec.encodeKey(key))) callbacks.push(item[1])
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
            fn(req.key)
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
  }
}

Ranges.prototype._encodeRange = function (range) {
  console.log(range)
  range = this.codec.encodeLtgt(range)
  console.log(range)
  var enc = messages.Range
  var buf = new Buffer(enc.encodingLength(range))
  enc.encode(range, buf)
  range = enc.decode(buf)
  rangeKeys().forEach(function (op) {
    if (range[op] === null || range[op] === undefined) {
      delete range[op]
    }
  })
  return range
}

function rangeKeys () {
  return ['gt', 'gte', 'lt', 'lte'];
}

function rangesEqual (range1, range2) {
  var empty = new Buffer(0)
  var keys = rangeKeys()
  return keys.filter(function (op) {
    if (range1[op] === undefined && range2[op] === undefined) return true
    return (range1[op] || empty).equals((range2[op] || empty))
  }).length === keys.length
}
