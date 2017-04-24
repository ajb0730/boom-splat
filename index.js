// pull in libraries
const app = require('express')()
const http = require('http').Server(app)
const server = require('socket.io')(http)
const _ = require('lodash')
const Player = require('./player')

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
let boards = []    // list of playing boards
let players = []   // list of players

// accept new connections from the client
server.on('connection', function (client){
  // client-wide globals
  let player
  let id
  
  // accept the 'hello, my name is...' message from the client
  client.on('auth', (opts, cb) => {  // 'opts' contains the name data from the client, 'cb' is how we send a message back to the client
    id = ++clientId
    player = new Player(_.assign({
      id: id,
      socket: client,
      name: 'Player ' + id
    }, opts))
    players.push(player)
    client.player = player
    console.log('[%s] has joined', player.name)
    // a player will start with a test board
  })
  
  // accept the disconnect message
  client.on('disconnect', () => {
    console.log('[%s] has left', client.player.name)
    _.remove(players,client.player)
  })
})

/*
 * Start Service
 */
http.listen(port, function(){
    console.log('listening on *:%d', port)
})
