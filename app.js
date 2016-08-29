var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var routes = require('./routes/index');
var app = express();

var http = require('http');
var server = http.createServer(app);
var io = require('socket.io').listen(server);
server.listen(8000);
io.set("origins", "*:*");

var Pantin = [
  room
];
var room = {
  name: 'Chambre Wesley',
  temperature: true,
  humidity: true,
  sensor: { temperature : 27, humidity: 55 },
  switches: [
    { name: 'Lumière', PIN: 12, type: 'dimmer', value: 0 },
    { name: 'Velux', PIN: [16, 17], type: 'motor', value: 0 }
  ]
};

io.on('connection', function (socket) {
  socket.emit('roomInit', room);
	setInterval(function(){
    room.sensor.temperature += Math.random()-0.5;
    room.sensor.humidity += 5*Math.random()-2.5;
    socket.emit('sensorUpdate',room.sensor);
  }, 5000);
  socket.on('changeDimmer', function(data){
    room.switches[data.id].value = data.value;
    console.log('Changement ', room.name, room.switches[data.id].name, data.value);
    // ici on comunique avec le RPI avant de propager l'information
    socket.broadcast.emit('valueChanged',data);
  });
});



app.use('/scripts', express.static(__dirname + '/node_modules/'));
app.use('/templates', express.static(__dirname + '/views/templates/'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});


module.exports = app;
