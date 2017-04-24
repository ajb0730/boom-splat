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
    player.direction = _.random(DIRECTION.north,DIRECTION.west)
    player.directionStr = CARDINAL[player.direction]
    do {
      player.x = _.random(0, this.size)
      player.y = _.random(0, this.size)
    } while(this.isCellOccupied(player.x,player.y))
  
    this.players.push(player)
    
    this.broadcast('joined',util.format('[%s] has joined at (%d,%d) facing %s', player.name, player.x, player.y, player.directionStr))
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
  }
  
  turnRight(player){
    player.direction += 1
    if(player.direction > DIRECTION.west) {
      player.direction = DIRECTION.north
    }
    player.directionStr = CARDINAL[player.direction]
  }
  
  moveForward
  
}

module.exports = Board