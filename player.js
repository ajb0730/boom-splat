"use strict"

const _ = require('lodash')
const util = require('util')


class Player {
  constructor(options) {
    _.assign(this, options)
    return this
  }
  
  fmtName(){
    return util.format('<font color="%s">%s</font>', this.color, this.name)
  }
}

module.exports = Player