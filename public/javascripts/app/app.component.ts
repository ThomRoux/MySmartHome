import {Component, Pipe, PipeTransform, NgZone} from 'angular2/core';

//import { Observable }     from 'rxjs/Observable';
//import { Subject } from 'rxjs/Subject';

//declare var jsonfile : any;
declare var _ :any;
declare var io : any;

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

    config : any = {};
    //config = {};

    device : any = {};

    constructor(private zone:NgZone){
        //this.config = jsonfile.readFileSync('/config.json');
        //console.log(this.config);
        this.socket = io('http://pictrl1.local:8000');
        this.socket.on('init', function(data){
            this.config = _.clone(data);
        }.bind(this));
    }
}
