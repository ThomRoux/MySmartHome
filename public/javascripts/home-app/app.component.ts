import {Component, NgZone} from 'angular2/core';

let SmartHome = {
  '192.168.1.65':{
    name: 'Chambre Wesley',
    floorplan: function(raph) {
      return raph.rect(500, 0, 280,300);
    }
  },
  '192.168.1.66':{
    name: 'Salle de Bain',
    floorplan: function(raph){
      return raph.rect(780,0,170,300)
    }
  },
  '192.168.1.67':{
    name: 'Atelier',
    floorplan: function(raph){
      return raph.path('M500,300L950,300L950,630L700,630L500,500L500,300')
    }
  },
  '192.168.1.68':{
    name: 'Cuisine',
    floorplan: function(raph){
      return raph.path('M200,630L0,630L0,0L500,0L500,500L700,630')
    }
  },
  '192.168.1.69':{
    name: 'Salon',
    floorplan: function(raph){
      return raph.path('M200,630L200,700L0,700L0,1140L950,1140L950,700L700,700L700,630')
    }
  }
};

@Component({
    selector: 'smarthome-app',
    templateUrl: 'templates/smarthouse.html'
})

export class AppComponent {

    date = new Date();

    constructor(private zone:NgZone){

    }
    ngAfterViewInit() {
      this.date =  new Date();
      setInterval(() => {
          this.date =  new Date();
       }, 1000);
      this.raph = Raphael("raph",450,450);
      _.mapObject(SmartHome, function(val, key) {
        var shape = val.floorplan(this);
        var _this = this;
        shape
          .attr({fill: '#ace', 'fill-opacity': 0.5, stroke: '#fff', 'stroke-width': 8})
          .mouseover(function(){this.attr({'fill-opacity':1});})
          .mouseout(function(){this.attr({'fill-opacity':0.5});})
          .click(function(){window.location.href='http://'+key+':3000'})
      },this.raph);
      this.raph.setViewBox(0,0,1200,1200,true);
    }


}
