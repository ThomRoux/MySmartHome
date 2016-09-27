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
var _ = require('underscore');
var rpio = {
  open : function(){},
  pwmSetClockDivider: function(){},
  pwmSetRange: function(){},
  pwmSetData: function(){},
  write: function(){},
  poll: function(){},
  PWM: 0,
  INPUT: 0,
  OUTPUT: 0
};//require('rpio');
server.listen(8000);
io.set("origins", "*:*");

/*
  CONNECTION AU MODULE GPIO DU RASPBERRY
*/
var rpio = require('rpio');
rpio.init({
  gpiomem: false,
  mapping: 'physical'
});

/*
  DEFINITION DES OBJETS CONNECTES
*/
var LED = function(_name, _outputPin, _switchPin, _rpio, _io) {
  this.name = _name;
  this.type = 'LED';
  this.outputPin = _outputPin;
  this.switchPin = _switchPin;
  this.level = 0;
  this.on = false;
  _rpio = _rpio || rpio;
  _io = _io || io;
  //this.rpio = _rpio;

  _rpio.open(this.outputPin, rpio.PWM);
  _rpio.pwmSetClockDivider(32);
  _rpio.pwmSetRange(this.outputPin, 1024);
  _rpio.open(this.switchPin, rpio.INPUT, rpio.PULL_UP);

  this.toggle = function() {
    if (this.on) this.turnOff();
    else this.turnOn();
  }

  this.turnOn = function() {
    _rpio.pwmSetData(this.outputPin, 1024);
    console.log("User turned on the LED with the switch");
    this.on = true;
    this.level = 100;
    _io.emit('valueChanged',this);
  }
  this.turnOff = function() {
    _rpio.pwmSetData(this.outputPin, 0);
    console.log("User turned off the LED with the switch");
    this.on = false;
    this.level = 0;
    _io.emit('valueChanged',this);
  }
  this.dimmer = function(value) {
    _rpio.pwmSetData(this.outputPin, Math.round(value*1024/100));
    this.level = value;
    this.on = (value>0);
    console.log("User dimmed the LED to value ", value);
    _io.emit('valueChanged',this);
  }

  // On met en place un watcher sur le switchPin, correspondant à une action effectuée sur la commande murale
  _rpio.poll(this.switchPin, this.toggle, rpio.POLL_BOTH);
}

var Light = function(_name, _powerPin, _switchPin, _rpio) {
  var _this = this;
  this.name = _name;
  this.type = 'Light';
  this.powerPin = _powerPin;
  this.switchPin = _switchPin;
  this.on = false;
  this.level = 0;
  this.lastSwitch = 0;

  _rpio = _rpio || rpio;
  this.switchValue = _rpio.LOW;

  _rpio.open(this.powerPin, rpio.OUTPUT);
  _rpio.write(this.powerPin, rpio.HIGH);
  _rpio.open(this.switchPin, rpio.INPUT, rpio.PULL_DOWN);

  this.toggle = function() {
    /*var dt = new Date();
    if (dt-this.lastSwitch > 200) {
      console.log(this.name,"toggled with switch");
      this.lastSwitch = dt;
    }*/

    if (this.on) this.turnOff();
    else this.turnOn();
  }
  this.turnOn = function() {
    _rpio.write(this.powerPin, rpio.LOW);
    this.level = 100;
    this.on = true;
    io.emit('valueChanged',this);
    console.log(this.name,"is on");
  }
  this.turnOff = function() {
    _rpio.write(this.powerPin, rpio.HIGH);
    this.level = 0;
    this.on = false;
    io.emit('valueChanged',this);
    console.log(this.name,"is off");
  }
  this.dimmer = function(value) {
    if (value==0) this.turnOff();
    if (value==100) this.turnOn();
  }

  this.checkSwitch = function(){
    if (_rpio.read(_this.switchPin)!=_this.switchValue) {
      _this.toggle();
      _this.switchValue = _rpio.read(_this.switchPin);
    }
  }

  // On met en place un watcher sur le switchPin, correspondant à une action effectuée sur la commande murale
  //_rpio.poll(this.switchPin, null, rpio.POLL_BOTH);
  _rpio.poll(this.switchPin, this.toggle.bind(this), rpio.POLL_BOTH);
  //this.poll = setInterval(this.checkSwitch, 200);
}

var RGBLED = function(_name, _dimmerPins, _switchPin, _rpio) {
  this.name = _name;
  this.type = 'RGB LED';
  this.dimmerPins = _dimmerPins;
  this.switchPin = _switchPin;
  this.rgb = [255,255,255];
  this.on = false;

  this.rpio.pwmSetClockDivider(64);
  this.rpio.open(this.dimmerPins[0],rpio.PWM);
  this.rpio.pwmSetRange(this.dimmerPin[0], 255);
  this.rpio.open(this.dimmerPin[1], rpio.PWM);
  this.rpio.pwmSetRange(this.dimmerPin[1], 255);
  this.rpio.open(this.dimmerPin[1], rpio.PWM);
  this.rpio.pwmSetRange(this.dimmerPin[1], 255);
  this.rpio.open(this.switchPin, rpio.INPUT);

  this.turnOn = function() {
    this.rpio.pwmSetData(this.dimmerPin[0], 255);
    this.rpio.pwmSetData(this.dimmerPin[1], 255);
    this.rpio.pwmSetData(this.dimmerPin[2], 255);
    this.rgb = [255,255,255];
    this.on = true;
  }
  this.turnOff = function() {
    this.rpio.pwmSetData(this.dimmerPin[0], 0);
    this.rpio.pwmSetData(this.dimmerPin[1], 0);
    this.rpio.pwmSetData(this.dimmerPin[2], 0);
    this.on = false;
  }
  this.dimmer = function(r,g,b) {
    if (r == 0 && g == 0 && b == 0) {
      this.turnOff();
    } else {
      this.rpio.pwmSetData(this.dimmerPin[0], r);
      this.rpio.pwmSetData(this.dimmerPin[1], g);
      this.rpio.pwmSetData(this.dimmerPin[2], b);
      this.rgb = [r,g,b];
      this.on = true;
    }
  }

  // On met en place un watcher sur le switchPin, correspondant à une action effectuée sur la commande murale
  this.rpio.poll(this.switchPin, this.toggle, rpio.POLL_BOTH);
}

var Motor = function(_name, _pins, _switchPins, _rpio) {
  this.name = _name;
  this.type = 'Motor';
  this.pins = _pins;
  this.switchPins = _switchPins;

}


var room = {
  name: 'Chambre Wesley',
  floorplan: function(raph) {
    return raph.rect(500, 0, 280,300);
  },
  temperature: true,
  humidity: true,
  sensor: { temperature : 27, humidity: 55 },
  switches: [
    { name: 'Lumière', PIN: 12, type: 'dimmer', value: 0 },
    { name: 'Velux', PIN: [16, 17], type: 'motor', value: 0 }
  ]
};

var configFromJSON = {
  "LED": function(data) {
    return new LED(data.name, data.outputPin, data.switchPin);
  },
  "Light": function(data) {
    return new Light(data.name, data.outputPin, 0);
  }
};
var config_json = {
  //'Cuisine': {type: 'LED', name: 'Cuisine', outputPin: 12, switchPin: 1},
  'Light': {type: 'Light', name: 'Light', outputPin: 7, switchPin: 11}
};
/*var config = _.mapObject(config_json, function(val, key) {
  return configFromJSON[val.type](val.name, val.outpuPin, val.switchPin);
});*/
var config = {
  'Light': new Light('Light',7,11)
};


io.on('connection', function (socket) {
  socket.emit('init', config);
  socket.on('valueChanged', function(data){
    config[data.id].dimmer(data.value);
  });
  socket.on('addDevice', function(data){ // data = {type:, name:, outputPin: switchPin:}
    config_json[data.name] = data;
    // save config.json file from config_json
    config_json[data.name] = configFromJSON[data.type](data.name, data.ouputPin, data.switchPin);
    io.emit('init', config);
  });
  socket.on('removeDevice', function(name){
    delete config_json[name];
    // save config.json from config_json
    // immediatly aply change to config
    delete config[name];
    io.emit('init', config);
  });
});


app.use('/config.json', express.static(__dirname + '/config.json'));
app.use('/scripts', express.static(__dirname + '/node_modules/'));
app.use('/templates', express.static(__dirname + '/views/templates/'));
app.use('/views', express.static(__dirname + '/views/'));
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
