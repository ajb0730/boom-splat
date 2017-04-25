// pull in libraries
const app = require('express')()
const http = require('http').Server(app)
const server = require('socket.io')(http)
const _ = require('lodash')

const Player = require('./player')
const Board = require('./board')

// pull in system config
const port = process.env.PORT || 3000

/*
 * HTTP Routing
 */

// proxy the Blockly code from the service itself
app.get('/blockly/*', function (req,res){
    res.sendFile(__dirname + '/node_modules/' + req.path)  
})

// serve the client page from the root
app.get('/', function (req,res){
    res.sendFile(__dirname + '/index.html')
})

/*
 * Server Code
 */

// server-wide globals
let clientId = 0   // unique client id
let players = []   // list of players
let boardId = 0    // unique board id
let boards = []    // list of active boards

// accept new connections from the client
var main = server.of('/')

main.on('connection', function (client){
  // client-wide globals
  let player
  let playerId
    
  // player has connected and is ready to start editing
  client.on('auth', (opts, cb) => {  // 'opts' contains the name data from the client, 'cb' is how we send a message back to the client
    playerId = ++clientId
    player = new Player(_.assign({
      id: playerId,
      name: 'Player ' + playerId,
      score: 0,
      tagged: 0,
    }, opts))
    players.push(player)
    
    client.player = player

    console.log('[%s] has joined', player.name)
    server.emit('status', '[' + player.id + '] <font color="red">' + player.name + '</font> has joined.')
    
    cb(player)
  })
  
  // player is in editing and wants to test their robot; put them in a 'private' board and start it running
  client.on('test', () => {
    var board = new Board({id: ++boardId, server: server})
    client.join(board.channel())
    board.addPlayer(player)
    boards.push(board)
    client.board = board
    board.run()
  })
  
  // player is in test and wants to go back to editing
  client.on('stop', () => {
    var board = client.board
    board.removePlayer(player)
    client.leave(board.channel())
    if(board.numPlayers() === 0){
      board.stop()
      _.remove(boards,function(b){return b.id === board.id})
    }
    delete client.board
  })
  
  // player is in editing and wants to go to the arena (compete against other robots)
  client.on('play', () => {
    // if no open board, create a new one
    // or, add player to existing open board
  })
  
  // player is in the arena and wants to go back to editing
  client.on('leave', () => {
    
  })  
  
  // player has left entirely
  client.on('disconnect', () => {
    _.remove(players,function (p) {
      return p.id === player.id
    })
    console.log('[%s] has left', player.name)
    server.emit('status', '[' + player.id + '] <font color="red">' + player.name + '</font> has left.')
    if(client.hasOwnProperty('board')){
      var board = client.board
      board.removePlayer(player)
      if(board.numPlayers() === 0){
        _.remove(function(b){return b.id === board.id})
      }
    }
  })
})

/*
 * Start Service
 */
http.listen(port, function(){
    console.log('listening on *:%d', port)
})
