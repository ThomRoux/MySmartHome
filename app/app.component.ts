import { Component, ViewChild } from '@angular/core';

//declare var room: object;
var Pantin = [
  room,
];
var room = {
  name: 'Chambre Wesley',
  canvas: function(el){
    var context, canvaso, contexto;
    context = el.getContext('2d');
  },
  temperature: true,
  humidity: true,
  switches: [
    { name: 'Lumière', PIN: 12, type: 'switch' },
    { name: 'Velux', PIN: [16, 17], type: 'motor' }
  ]
};

@Component({
  selector: 'my-app',
  templateUrl: 'app/main.html'
})


export class AppComponent {

  //@ViewChild('canvas') canvas;
  //@ViewChild('content') content;

  room = room;
  date = new Date();

  ngAfterViewInit() {
    this.date =  new Date();
    setInterval(() => {
        this.date =  new Date();
     }, 1000);
    //room.canvas(this.canvas.nativeElement);
  }
}
