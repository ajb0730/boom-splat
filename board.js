"use strict"

const _ = require('lodash')
const util = require('util')

const DIRECTION = {
  north: 0,
  east: 1,
  south: 2,
  west: 3
}

const CARDINAL = [
  'North',
  'East',
  'South',
  'West'
]

class Board {
  constructor(options) {
    this.players = []
    this.size = 25
    this.winner = 3
    _.assign(this, options)
    return this
  }
  
  hasPlayer(player){
    return _.find(this.players, function(p) { return p.id === player.id })
  }
  
  numPlayers() {
    return this.players.length
  }
  
  addPlayer(player){
    player.tagged = 0
    player.score = 0
    player.direction = _.random(DIRECTION.north,DIRECTION.west)
    player.directionStr = CARDINAL[player.direction]
    do {
      player.x = _.random(0, this.size)
      player.y = _.random(0, this.size)
    } while(this.isCellOccupied(player.x,player.y))
  
    this.players.push(player)
    
    this.broadcast('joined',player)
    console.log(util.format('[%s] has joined at (%d,%d) facing %s', player.name, player.x, player.y, player.directionStr))
  }
                   
  isCellOccupied(x,y){
    return _.find(this.players,function(p) { p.x === x && p.y === y })
  }
  
  broadcast(type,message){
    _.forEach(this.players,function(p) { p.socket.emit(type,message) })
  }
  
  turnLeft(player){
    player.direction -= 1
    if(player.direction < DIRECTION.north) {
      player.direction = DIRECTION.west
    }
    player.directionStr = CARDINAL[player.direction]
    this.update(player)
    return true
  }
  
  turnRight(player){
    player.direction += 1
    if(player.direction > DIRECTION.west) {
      player.direction = DIRECTION.north
    }
    player.directionStr = CARDINAL[player.direction]
    this.update(player)
    return true
  }
  
  moveForward(player){
    var x = player.x
    var y = player.y
    switch(player.direction){
      case DIRECTION.north:
        x += 1
        break
      case DIRECTION.east:
        y += 1
        break
      case DIRECTION.south:
        x -= 1
        break
      case DIRECTION.west:
        y -= 1
        break;
    }
    if(x<0 || x >= this.size || y < 0 || y >= this.size || this.isCellOccupied(x,y)){
      return false
    }
    player.x = x
    player.y = y
    this.update(player)
    return true
  }
  
  tag(player){
    var x = player.x
    var y = player.y
    switch(player.direction){
      case DIRECTION.north:
        x += 1
        break
      case DIRECTION.east:
        y += 1
        break
      case DIRECTION.south:
        x -= 1
        break
      case DIRECTION.west:
        y -= 1
        break;
    }
    var target = this.isCellOccupied(x,y)
    if(target){
      target.tagged += 1
      player.score += 1
      this.broadcast('update',target)
      this.broadcast('update',player)
      console.log(util.format('[%s] was tagged by [%s]!', target.name, player.name))
      /*
      if(player.score >= this.winner){
        this.broadcast('winner',player)
        console.log(util.format('[%s] has won!', player.name))
      }
      */
    }
  }
  
  update(player){
    this.broadcast('update',player)
    console.log(util.format('[%s] is now at (%d,%d) facing %s', player.name, player.x, player.y, player.directionStr))    
  }
  
}

module.exports = Board