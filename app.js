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
var rpio = require('rpio');
rpio.init({
  gpiomem: false,
  mapping: 'physical'
});
var Gpio = require('pigpio').Gpio;

/*
  CONFIGURATION DE LA BOX
*/
MyBox = {
  'switches': {
    1: 3, 2: 5, 3: 7, 4: 11,
    5: 13, 6: 15, 7: 19, 8: 21,
    9: 8, 10: 10, 11: 16, 12: 18
  },
  'devices': {
    1: { type: 'Low Voltage Dimmable', pin: 32},
    2: { type: 'Low Voltage Dimmable', pin: 12},
    3: { type: 'Low Voltage Dimmable', pin: 35},
    4: { type: 'Low Voltage Dimmable', pin: 33},
    5: { type: 'Power Relay', pin: 23},
    6: { type: 'Power Relay', pin: 31},
    7: { type: 'Power Relay', pin: 29},
    8: { type: 'Power Relay', pin: 27},
  }
}

/*
  DEFINITION DES OBJETS CONNECTES
*/
var LED = function(_name, _outputPin, _switchPin, _rpio) {
  //_rpio = _rpio || rpio;
  var _this = this;
  this.name = _name;
  this.type = 'LED';
  this.outputPin = _outputPin;
  this.switchPin = _switchPin;
  this.level = this.range;
  this.on = (this.level>0);
  this.lastSwitch = 0;
  //this.switchValue = _rpio.LOW;
  this.pwm = new Gpio(this.outputPin, {mode: Gpio.OUTPUT});
  this.switch = new Gpio(this.switchPin, {
    mode: Gpio.INPUT,
    pullUpDown: Gpio.PUD_UP,
    edge: Gpio.EITHER_EDGE
  });
  this.switchValue = this.switch.digitalRead();


  this.pwm.pwmWrite(0);
  //_rpio.open(this.switchPin, _rpio.INPUT, _rpio.PULL_UP);

  this.toggle = function(level) {
    var dt = new Date();
    if (dt-this.lastSwitch > 200) {
      //_rpio.msleep(20);
      setTimeout(null, 20);
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
  //_rpio.poll(this.switchPin, this.toggle.bind(this), _rpio.POLL_BOTH);
  this.switch.on('interrupt', this.toggle.bind(this));
  io.emit("valueChanged", this);
}

var Light = function(_name, _powerPin, _switchPin, _rpio) {
  _rpio = _rpio || rpio;
  var _this = this;
  this.name = _name;
  this.type = 'Light';
  this.powerPin = _powerPin;
  this.switchPin = _switchPin;
  this.on = false;
  this.level = 0;
  this.lastSwitch = 0;


  _rpio.open(this.powerPin, _rpio.OUTPUT);
  _rpio.write(this.powerPin, _rpio.HIGH);
  _rpio.open(this.switchPin, _rpio.INPUT, _rpio.PULL_UP);
  this.switchValue = _rpio.read(this.switchPin);

  this.toggle = function() {
    var dt = new Date();
    if (dt-this.lastSwitch > 200) {
      _rpio.msleep(20);
      if (_rpio.read(_this.switchPin)!=_this.switchValue) {
        this.lastSwitch = dt;
        _this.switchValue = _rpio.read(_this.switchPin);
        console.log((new Date()).toTimeString().slice(0, 8),this.name,"toggled with switch");
        if (this.on) this.turnOff();
        else this.turnOn();
      }
    }
  }
  this.turnOn = function() {
    _rpio.write(this.powerPin, _rpio.LOW);
    this.level = 100;
    this.on = true;
    io.emit('valueChanged',this);
    console.log((new Date()).toTimeString().slice(0, 8),this.name,"is on");
  }
  this.turnOff = function() {
    _rpio.write(this.powerPin, _rpio.HIGH);
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
  _rpio.poll(this.switchPin, this.toggle.bind(this), _rpio.POLL_BOTH);
  io.emit("valueChanged", this);
}

var Motor = function(_name, _powerPins, _switchPins, _rpio) {
  _rpio = _rpio || rpio;
  var _this = this;
  this.name = _name;
  this.type = 'Motor';
  this.powerPins = _powerPins;
  this.switchPins = _switchPins;
  this.on = false;
  this.level = 0;
  this.lastSwitch = 0;
  this.switchValues = {
    //_switchPins[0]: _rpio.read(_switchPins[0]),
    //_switchPins[1]: _rpio.read(_switchPins[1])
  };

  _rpio.open(this.powerPin, _rpio.OUTPUT);
  _rpio.write(this.powerPin, _rpio.HIGH);
  _rpio.open(this.switchPin, _rpio.INPUT, _rpio.PULL_UP);

  this.toggle = function(pin) {
    var dt = new Date();
    if (dt-this.lastSwitch > 200) {
      _rpio.msleep(20);
      if (_rpio.read(_this.switchPin)!=_this.switchValue) {
        this.lastSwitch = dt;
        _this.switchValue = _rpio.read(_this.switchPin);
        console.log(new Date(),this.name,"toggled with switch");
        if (this.on) this.turnOff();
        else this.turnOn();
      }
    }
  }
  this.turnOn = function() {
    _rpio.write(this.powerPin, _rpio.LOW);
    this.level = 100;
    this.on = true;
    io.emit('valueChanged',this);
    console.log(new Date(),this.name,"is on");
  }
  this.turnOff = function() {
    _rpio.write(this.powerPin, _rpio.HIGH);
    this.level = 0;
    this.on = false;
    io.emit('valueChanged',this);
    console.log(new Date(),this.name,"is off");
  }
  this.dimmer = function(value) {
    if (value==0) this.turnOff();
    if (value==100) this.turnOn();
  }

  // On met en place un watcher sur le switchPin, correspondant à une action effectuée sur la commande murale
  _rpio.poll(this.switchPin[0], this.toggle.bind(this), _rpio.POLL_BOTH);
  _rpio.poll(this.switchPin[1], this.toggle.bind(this), _rpio.POLL_BOTH);
  io.emit("valueChanged", this);
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
  'Light': new Light('Light',7,13),
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
