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
server.listen(8000);
io.set("origins", "*:*");

/*
  CONNECTION AU MODULE GPIO DU RASPBERRY
*/
/*var rpio = require('rpio');
rpio.init({
  gpiomem: false,
  mapping: 'physical'
});*/
var Gpio = require('pigpio').Gpio;

/*
  CONFIGURATION DE LA BOX
*/
MyBox = {
  'switches': {
    'Switch 1': 13/*21*/,
    'Switch 2': 17/*20*/,
    'Switch 3': 16,
    'Switch 4': 12,
    'Switch 5': 7,
    'Switch 6': 8,
    'Switch 7': 25,
    'Switch 8': 24,
    'Switch 9': 23,
    'Switch 10': 18,
    'Switch 11': 15,
    'Switch 12': 14
  },
  'devices': {
    'DC 1': 18/*29*/,
    'DC 2': 19,
    'DC 3': 13,
    'DC 4': 6,
    'DC 5': 5,
    'DC 6': 11,
    'Relay 1': 4/*22*/,
    'Relay 2': 27,
    'Relay 3': 17,
    'Relay 4': 4,
    'Relay 5': 3,
    'Relay 6': 2
  }
}

/*
  DEFINITION DES OBJETS CONNECTES
*/
var LED = function(_name, _outputPin, _switchPin) {
  //_rpio = _rpio || rpio;
  var _this = this;
  this.name = _name;
  this.type = 'LED';
  this.powerPin = _outputPin;
  this.switchPin = _switchPin;
  this.level = this.range;
  this.on = (this.level>0);
  this.lastSwitch = 0;
  // OUTPUT Pin and INPUT Pin are created
  this.pwm = new Gpio(this.powerPin, {mode: Gpio.OUTPUT});
  this.switch = new Gpio(this.switchPin, {
    mode: Gpio.INPUT,
    pullUpDown: Gpio.PUD_UP,
    edge: Gpio.EITHER_EDGE
  });

  this.switchValue = this.switch.digitalRead();
  this.pwm.pwmWrite(0);

  this.toggle = function(level) {
    var dt = new Date();
    if (dt-this.lastSwitch > 200) {
      setTimeout(function(){}, 20);
      if (level!=_this.switchValue) {
        _this.lastSwitch = dt;
        this.switchValue = level;
        console.log(new Date().toTimeString().slice(0, 8),this.name,"toggled with switch");
        if (this.on) this.turnOff();
        else this.turnOn();
      }
    }
  }

  this.turnOn = function() {
    this.pwm.pwmWrite(255);
    this.on = true;
    this.level = 100;
    io.emit('valueChanged',this);
    console.log(new Date().toTimeString().slice(0, 8), this.name, "turned on");
  }
  this.turnOff = function() {
    this.pwm.pwmWrite(0);
    this.on = false;
    this.level = 0;
    io.emit('valueChanged',this);
    console.log(new Date().toTimeString().slice(0, 8), this.name, "turned off");
  }
  this.dimmer = function(value) {
    this.pwm.pwmWrite(Math.floor(value*2.55));
    this.level = Math.round(value);
    this.on = (value>0);
    io.emit('valueChanged',this);
    console.log(new Date().toTimeString().slice(0, 8), this.name, "dimmed to value", this.level);
  }

  // On met en place un watcher sur le switchPin, correspondant à une action effectuée sur la commande murale
  this.switch.on('interrupt', this.toggle.bind(this));
  io.emit("valueChanged", this);
}

var Light = function(_name, _powerPin, _switchPin) {
  var _this = this;
  this.name = _name;
  this.type = 'Light';
  this.powerPin = _powerPin;
  this.switchPin = _switchPin;
  this.on = false;
  this.level = 0;
  this.lastSwitch = 0;

  this.out = new Gpio(this.powerPin, {mode: Gpio.OUTPUT});
  this.switch = new Gpio(this.switchPin, {
    mode: Gpio.INPUT,
    pullUpDown: Gpio.PUD_UP,
    edge: Gpio.EITHER_EDGE
  });

  this.switchValue = this.switch.digitalRead();
  this.out.digitalWrite(this.on==100?0:1);

  this.toggle = function(level) {
    var dt = new Date();
    if (dt-this.lastSwitch > 200) {
      setTimeout(function(){}, 20);
      if (level!=_this.switchValue) {
        this.lastSwitch = dt;
        _this.switchValue = level;
        console.log((new Date()).toTimeString().slice(0, 8),this.name,"toggled with switch");
        if (this.on) this.turnOff();
        else this.turnOn();
      }
    }
  }
  this.turnOn = function() {
    this.out.digitalWrite(0);
    this.level = 100;
    this.on = true;
    io.emit('valueChanged',this);
    console.log((new Date()).toTimeString().slice(0, 8),this.name,"is on");
  }
  this.turnOff = function() {
    this.out.digitalWrite(1);
    this.level = 0;
    this.on = false;
    io.emit('valueChanged',this);
    console.log((new Date()).toTimeString().slice(0, 8),this.name,"is off");
  }
  this.dimmer = function(value) {
    if (value==0) this.turnOff();
    if (value==100) this.turnOn();
  }

  // On met en place un watcher sur le switchPin, correspondant à une action effectuée sur la commande murale
  this.switch.on('interrupt', this.toggle.bind(this));
  io.emit("valueChanged", this);
}

var configFromJSON = {
  "LED": function(data) {
    return new LED(data.name, data.outputPin, data.switchPin);
  },
  "Light": function(data) {
    return new Light(data.name, data.outputPin, da);
  }
};
var config_json = {
  //'Cuisine': {type: 'LED', name: 'Cuisine', outputPin: 12, switchPin: 1},
  'Light': {type: 'Light', name: 'Light', output: 'Relay 1', switch: 'Switch 1'},
  'LED': {type: 'LED', name: 'LED', output: 'DC 1', switch: 'Switch 2'}
};
console.log(_);
var config = _.mapObject(config_json, function(val, key) {
  return configFromJSON[val.type](val.name, MyBox['devices'][val.output], MyBox['switches'][val.switch]);
});
var config = {
  'Light': new Light('Light',4,13),
  'LED': new LED('LED',18,17)
};


io.on('connection', function (socket) {
  socket.emit('init', config);
  socket.on('valueChanged', function(data){
    config[data.id].dimmer(data.value);
  });
  socket.on('clockChanged', function(data){
    console.info(data, typeof data.value);
    config[data.id].setClock(data.value);
  });
  socket.on('rangeChanged', function(data){
    console.info(data, typeof data.value);
    config[data.id].setRange(data.value);
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
    // immediatly apply change to config
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
