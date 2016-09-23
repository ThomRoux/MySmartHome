import {Component, NgZone} from 'angular2/core';

@Component({
    selector: 'smarthome-app',
    templateUrl: 'templates/main.html'
})

export class AppComponent {
    socket = null;

    //room: Object = { sensor : {} };// = room;
    config = {};
    //date = new Date();

    constructor(private zone:NgZone){
        this.socket = io('http://192.168.1.6:8000');
        this.socket.on('init', function(data){
            this.config = data;
        }.bind(this));
        /*this.socket.on('roomInit', function(data){
          this.room = data;
        }.bind(this));
        this.socket.on('sensorUpdate', function(data){
          this.room.sensor = data;
        }.bind(this));
        this.socket.on('valueChanged', function(data){
          this.room.switches[data.id].value = data.value;
        }.bind(this));*/
    }

    /*changeValue(id, value) {
      this.socket.emit('valueChanged',{id: id, value: value});
    }

    ngAfterViewInit() {
      this.date =  new Date();
      setInterval(() => {
          this.date =  new Date();
       }, 1000);
      this.socket.emit('requestRoom');
    }*/


}
