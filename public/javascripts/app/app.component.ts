import {Component, Pipe, PipeTransform, NgZone} from 'angular2/core';

import { Observable }     from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

@Pipe({name: 'keys'})
export class KeysPipe implements PipeTransform {
  transform(value, args:string[]) : any {
    let keys = [];
    for (let key in value) {
      keys.push({key: key, value: value[key]});
    }
    return keys;
  }
}

@Component({
    selector: 'smarthome-app',
    templateUrl: 'templates/main.html',
    pipes: [KeysPipe]
})

export class AppComponent {
    socket = null;

    //room: Object = { sensor : {} };// = room;
    //config = {};
    //date = new Date();

    _config : Subject<any>

    constructor(private zone:NgZone){
        this.socket = io('http://pictrl1.local:8000');
        this.socket.on('init', function(data){
            //this.config = data;
            this._config.next(data);
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

    get config() {
      return this._config.asObservable();
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
