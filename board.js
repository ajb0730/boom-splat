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
    this.loop = false
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
    this.broadcast('status', player.fmtName() + ' has joined the arena.')    
    return player
  }
  
  removePlayer(player){
    if(this.hasPlayer(player)){
      _.remove(this.players,(p) => { return p.id === player.id })
      delete player.channel
      this.broadcast('remove',player)
      this.broadcast('status', player.fmtName() + ' has left the arena.')
    }
  }
  
  register(client){
    var me = this
    client.join(me.channel())
    me.addPlayer(client.player)
    client.board = me
    client.on('turn left',client.handlers.turnLeft)
    client.on('turn right',client.handlers.turnRight)
    client.on('move forward',client.handlers.moveForward)
    client.on('tag',client.handlers.tag)
    client.on('distance to wall',client.handlers.distanceToWall)
    client.on('distance to bot',client.handlers.distanceToBot)
    client.on('bot in front',client.handlers.botInFront)
  }
  
  unregister(client){
    this.removePlayer(client.player)
    client.leave(this.channel())
    client.removeListener('turn left',client.handlers.turnLeft)
    client.removeListener('turn right',client.handlers.turnRight)
    client.removeListener('move forward',client.handlers.moveForward)
    client.removeListener('tag',client.handlers.tag)
    client.removeListener('distance to wall',client.handlers.distanceToWall)
    client.removeListener('distance to bot',client.handlers.distanceToBot)
    client.removeListener('bot in front',client.handlers.botInFront)
    delete client.board
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
    var target = this.botInFront(player)
    if(target){
      target.tagged += 1
      player.score += 1
      this.update(target)
      this.update(player)
      this.broadcast('status',util.format('[%s] was tagged by [%s]!', target.fmtName(), player.fmtName()))
      return true
    }
    return false
  }
  
  // returns true if there is another bot in front of the player
  botInFront(player){
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
    return this.isCellOccupied(x,y)
  }
  
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
    //console.log('Distance to wall for (%d,%d,%s) is %d', player.x, player.y, player.directionStr, result)
    return result
  }
  
  distanceToBot(player){
    if(this.players.length <= 1){
      return 0;
    }
    var target;
    var distance = 0;
    switch(player.direction){
      case DIRECTION.north:
        target = _.find(this.players,(p) => { return (p.x === player.x && p.y > player.y) });
        distance = target.y - player.y;
        break;
      case DIRECTION.east:
        target = _.find(this.players,(p) => { return (p.y === player.y && p.x > player.x) });
        distance = target.x - player.x;
        break;
      case DIRECTION.south:
        target = _.find(this.players,(p) => { return (p.x === player.x && player.y > p.y) });
        distance = player.y - target.y;
        break;
      case DIRECTION.west:
        target = _.find(this.players,(p) => { return (p.y === player.y && player.x > p.x) });
        distance = player.x - target.x;
        break;
    }
    return distance;
  }
  /*
  running(){
    return this.loop;
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
    if(!sockets_in_room){
      this.loop = false
      return
    }
    var promises = []
    var status = {}
    for (var socketId in sockets_in_room.sockets) {
      var client = me.server.sockets.connected[socketId]
      if(client.hasOwnProperty('player')){
        //console.log('request command from [%s] at %s',client.player.name,socketId)
        status[client.id] = undefined
        var promise = new Promise((resolve,reject) => {
          var myClient = client
          //console.log('[%s] request command', client.player.name)
          myClient.emit('request command',me.channel(),(command) => {
            var innerClient = myClient;
            //console.log('[%s] %s', innerClient.player.name, command)
            commands.push({player: innerClient.player, command: command, client: innerClient})
            status[innerClient.id].status = true
            resolve(1)
          })
          setTimeout(() => {
            status[myClient.id].status = false
            reject(myClient.player) 
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
          case 'bot in front':
            result = me.botInFront(cmd.player) ? true : false
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
  */
}

module.exports = Board