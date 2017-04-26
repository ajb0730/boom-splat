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
let arena = new Board({id: ++boardId, server: server})

// http://stackoverflow.com/a/7419630/16780
var rainbow = function (numOfSteps, step) {
    // This function generates vibrant, "evenly spaced" colours (i.e. no clustering). This is ideal for creating easily distinguishable vibrant markers in Google Maps and other apps.
    // Adam Cole, 2011-Sept-14
    // HSV to RBG adapted from: http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
    var r, g, b;
    var h = step / numOfSteps;
    var i = ~~(h * 6);
    var f = h * 6 - i;
    var q = 1 - f;
    switch(i % 6){
        case 0: r = 1; g = f; b = 0; break;
        case 1: r = q; g = 1; b = 0; break;
        case 2: r = 0; g = 1; b = f; break;
        case 3: r = 0; g = q; b = 1; break;
        case 4: r = f; g = 0; b = 1; break;
        case 5: r = 1; g = 0; b = q; break;
    }
    var c = "#" + ("00" + (~ ~(r * 255)).toString(16)).slice(-2) + ("00" + (~ ~(g * 255)).toString(16)).slice(-2) + ("00" + (~ ~(b * 255)).toString(16)).slice(-2);
    return (c);
};

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
      color: rainbow(10, (playerId % 10) + 1),
      score: 0,
      tagged: 0,
    }, opts))
    players.push(player)
    
    client.player = player

    console.log('[%s] has joined the game', player.name)
    server.emit('status', player.fmtName() + ' has joined the game.')
    
    cb(player)
  })
  
  // player is in editing and wants to test their robot; put them in a 'private' board and start it running
  client.on('test', (callback) => {
    var board = new Board({id: ++boardId, server: server})
    client.join(board.channel())
    board.addPlayer(player)
    client.board = board
    board.run()
    callback(board.size)
  })
  
  // player is in test and wants to go back to editing
  client.on('stop', () => {
    if(client.hasOwnProperty('board')){
      var board = client.board
      board.removePlayer(player)
      client.leave(board.channel())
      if(board.numPlayers() === 0){
        board.stop()
      }
      delete client.board      
    }
  })
  
  // player is in editing and wants to go to the arena (compete against other robots)
  client.on('play', (callback) => {
    client.join(arena.channel())
    arena.addPlayer(player)
    client.board = arena
    if(!arena.running())
      arena.run()
    callback(arena.size)
  })
    
  // player has left entirely
  client.on('disconnect', () => {
    if(player){
      _.remove(players,function (p) {
        return null === p || p.id === player.id
      })
      console.log('[%s] has left the game', player.name)
      server.emit('status', player.fmtName() + ' has left the game.')
    }
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
