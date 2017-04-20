var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http)

// proxy the Blockly code from the service itself
app.get('/blockly/*', function (req,res){
    res.sendFile(__dirname + '/node_modules/' + req.path)  
})

app.get('/', function (req,res){
    res.sendFile(__dirname + '/index.html')
})

io.on('connection', function (socket){
})

http.listen(3000, function(){
    console.log('listening on *:3000')
})
