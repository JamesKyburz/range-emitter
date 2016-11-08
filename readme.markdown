# range-emitter

range emitter using [levelup] ranges.

Inspired by [multileveldown]

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

[![build status](https://api.travis-ci.org/JamesKyburz/range-emitter.svg)](https://travis-ci.org/JamesKyburz/range-emitter)
[![npm](https://img.shields.io/npm/v/range-emitter.svg)](https://npmjs.org/package/range-emitter)
[![downloads](https://img.shields.io/npm/dm/range-emitter.svg)](https://npmjs.org/package/range-emitter)

[![Sauce Test Status](https://saucelabs.com/browser-matrix/range-emitter.svg)](https://saucelabs.com/u/range-emitter)

# methods

```javascript
var re = require('range-emitter')
```

## `re.subscribe (range, cb, [resend=false])`

`range` in the format of [ltgt]

`cb` callback(key, type) type can be `put` or `delete`

`resend` if true will resend the subscriptions to the server

## `re.subscribe (key, cb, [resend=false])`

`key` single key to subscribe to

`cb` callback(key, type) type can be `put` or `delete`

`resend` if true will resend the subscriptions to the server

## `re.subscribe (cb, [resend=false])`

subscribe to all keys

`cb` callback(key, type) type can be `put` or `delete`

`resend` if true will resend the subscriptions to the server

## `re.unsubscribe (rangeOrKey, cb)`

unsubscribe a range or key

## `re.publish (key, type)`

[ltgt]: https://www.npmjs.com/package/ltgt
[levelup]: https://github.com/Level/levelup
[multileveldown]: https://github.com/mafintosh/multileveldown
