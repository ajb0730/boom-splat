"use strict"

const _ = require('lodash')

class Player {
  constructor(options) {
    _.assign(this, options)
    return this
  }
}

module.exports = Player