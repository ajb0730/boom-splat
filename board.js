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
//    this.winner = 3
    this.open = false
    _.assign(this, options)
    return this
  }
  
  channel(){
    return 'board-' + this.id
  }

  broadcast(event,data){
    this.server.to(this.channel()).emit(event,data)
  }

  update(player){
    this.broadcast('update',player)
  }
  
  refresh() {
    var me = this
    //console.log(me.players)
    _.forEach(me.players, function(p) { me.update(p) })
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
      player.x = _.random(0, this.size-1)
      player.y = _.random(0, this.size-1)
    } while(this.isCellOccupied(player.x,player.y))
    player.channel = this.channel()
    this.players.push(player)
    this.refresh()
    return player
  }
  
  removePlayer(player){
    if(this.hasPlayer(player)){
      _.remove(this.players,(p) => { return p.id === player.id })
      delete player.channel
      this.broadcast('remove',player)
    }
  }
                   
  isCellOccupied(x,y){
    return _.find(this.players,function(p) { return p.x === x && p.y === y })
  }
  
  turnLeft(player){
    //console.log('start: x %d y %d d %s', player.x, player.y, player.directionStr)
    player.direction -= 1
    if(player.direction < DIRECTION.north) {
      player.direction = DIRECTION.west
    }
    player.directionStr = CARDINAL[player.direction]
    this.update(player)
    //console.log('  end: x %d y %d d %s', player.x, player.y, player.directionStr)
    return true
  }
  
  turnRight(player){
    //console.log('start: x %d y %d d %s', player.x, player.y, player.directionStr)
    player.direction += 1
    if(player.direction > DIRECTION.west) {
      player.direction = DIRECTION.north
    }
    player.directionStr = CARDINAL[player.direction]
    this.update(player)
    //console.log('  end: x %d y %d d %s', player.x, player.y, player.directionStr)
    return true
  }
  
  moveForward(player){
    var x = player.x
    var y = player.y
    //console.log('start: x %d y %d d %s', player.x, player.y, player.directionStr)
    switch(player.direction){
      case DIRECTION.north:
        y += 1
        break
      case DIRECTION.east:
        x += 1
        break
      case DIRECTION.south:
        y -= 1
        break
      case DIRECTION.west:
        x -= 1
        break;
    }
    if(x<0 || x >= this.size || y < 0 || y >= this.size || this.isCellOccupied(x,y)){
      //console.log('rejected')
      return false
    }
    player.x = x
    player.y = y
    //console.log('  end: x %d y %d d %s', player.x, player.y, player.directionStr)    
    this.update(player)
    return true
  }
  
  tag(player){
    var x = player.x
    var y = player.y
    switch(player.direction){
      case DIRECTION.north:
        y += 1
        break
      case DIRECTION.east:
        x += 1
        break
      case DIRECTION.south:
        y -= 1
        break
      case DIRECTION.west:
        x -= 1
        break;
    }
    //console.log('  tag: x %d y %d d %s', x, y, player.directionStr)
    var target = this.isCellOccupied(x,y)
    if(target){
      target.tagged += 1
      player.score += 1
      //console.log(util.format('[%s] was tagged by [%s]!', target.name, player.name))
      this.update(target)
      this.update(player)
      this.broadcast('status',util.format('[%s] was tagged by [%s]!', target.name, player.name))
      /*
      if(player.score >= this.winner){
        this.broadcast('winner',player)
        console.log(util.format('[%s] has won!', player.name))
      }
      */
      return true
    }
    return false
  }
  
  // returns 0 if there are no bots in a straight line in front of where bot is facing
  // otherwise, returns number of 'moveForward' commands to bring bot to next bot
  /*
  distanceToBot(player){
  }
  */
  
  // returns number of 'moveForward' commands to next wall
  distanceToWall(player){
    var result = -1
    switch(player.direction){
      case DIRECTION.north:
        result = this.size - 1 - player.y;
        break;
      case DIRECTION.east:
        result = this.size - 1 - player.x;
        break;
      case DIRECTION.south:
        result = player.y;
        break;
      case DIRECTION.west:
        result = player.x;
        break;
    }
    console.log('Distance to wall for (%d,%d) is %d', player.x, player.y, result)
    return result
  }
  
  run(){
    this.loop = true
    this.done = false
    this._run()
    var timer
    timer = setInterval(() => {
      if(!this.loop) {
        clearInterval(timer)
      } else if(this.done === true) { 
        this.done = false
        this._run()
      }
    }, 100)
  }
    
  _run(){
    var me = this
    var commands = []
      
    var sockets_in_room = me.server.nsps['/'].adapter.rooms[me.channel()]
    var promises = []
    var status = {}
    for (var socketId in sockets_in_room.sockets) {
      var client = me.server.sockets.connected[socketId]
      if(client.hasOwnProperty('player')){
        //console.log('request command from [%s] at %s',client.player.name,socketId)
        status[client.id] = undefined
        var promise = new Promise((resolve,reject) => {
          client.emit('request command',me.channel(),(command) => {
            commands.push({player: client.player, command: command, client: client})
            status[client.id].status = true
            resolve(1)
          })
          setTimeout(() => {
            status[client.id].status = false
            reject(client.player) 
          },500)
        })
        promises.push(promise)
        status[client.id] = {status: undefined, promise: promise}
      }        
    }
    Promise.all(promises).then(() => {
      var responses = 0
      _.forEach(commands,function(cmd){
        var result = false
        responses += 1
        switch(cmd.command){
          case 'turn left':
            result = me.turnLeft(cmd.player)
            break;
          case 'turn right':
            result = me.turnRight(cmd.player)
            break;
          case 'move forward':
            result = me.moveForward(cmd.player)
            break;
          case 'tag':
            result = me.tag(cmd.player)
            break;
          case 'distance to wall':
            result = me.distanceToWall(cmd.player)
            break;
          default:
            console.log('Unrecognized command \'%s\' from [%s]', cmd.command, cmd.player.name)
        }
        //console.log('responses %d of %d', responses, promises.length)
        if(responses === promises.length){
          me.done = true
        }
        cmd.client.emit('result',{command: cmd.command, result: result})        
      })
    })
    .catch((player) => {
      console.log('Timeout waiting for [%s] to respond', player.name)
      me.done = true
    })
  }

  stop(){
    this.loop = false
  }
}

module.exports = Board