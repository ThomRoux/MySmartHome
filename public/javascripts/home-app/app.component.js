System.register(['angular2/core'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata = (this && this.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    var core_1;
    var SmartHome, AppComponent;
    return {
        setters:[
            function (core_1_1) {
                core_1 = core_1_1;
            }],
        execute: function() {
            SmartHome = {
                '192.168.1.65': {
                    name: 'Chambre Wesley',
                    floorplan: function (raph) {
                        return raph.rect(500, 0, 280, 300);
                    }
                },
                '192.168.1.66': {
                    name: 'Salle de Bain',
                    floorplan: function (raph) {
                        return raph.rect(780, 0, 170, 300);
                    }
                },
                '192.168.1.67': {
                    name: 'Atelier',
                    floorplan: function (raph) {
                        return raph.path('M500,300L950,300L950,630L700,630L500,500L500,300');
                    }
                },
                '192.168.1.68': {
                    name: 'Cuisine',
                    floorplan: function (raph) {
                        return raph.path('M200,630L0,630L0,0L500,0L500,500L700,630');
                    }
                },
                '192.168.1.69': {
                    name: 'Salon',
                    floorplan: function (raph) {
                        return raph.path('M200,630L200,700L0,700L0,1140L950,1140L950,700L700,700L700,630');
                    }
                }
            };
            AppComponent = (function () {
                function AppComponent(zone) {
                    this.zone = zone;
                    this.date = new Date();
                }
                AppComponent.prototype.ngAfterViewInit = function () {
                    var _this = this;
                    this.date = new Date();
                    setInterval(function () {
                        _this.date = new Date();
                    }, 1000);
                    this.raph = Raphael("raph", 450, 450);
                    _.mapObject(SmartHome, function (val, key) {
                        var shape = val.floorplan(this);
                        var _this = this;
                        shape
                            .attr({ fill: '#ace', 'fill-opacity': 0.5, stroke: '#fff', 'stroke-width': 8 })
                            .mouseover(function () { this.attr({ 'fill-opacity': 1 }); })
                            .mouseout(function () { this.attr({ 'fill-opacity': 0.5 }); })
                            .click(function () { window.location.href = 'http://' + key + ':3000'; });
                    }, this.raph);
                    this.raph.setViewBox(0, 0, 1200, 1200, true);
                };
                AppComponent = __decorate([
                    core_1.Component({
                        selector: 'smarthome-app',
                        templateUrl: 'templates/smarthouse.html'
                    }), 
                    __metadata('design:paramtypes', [core_1.NgZone])
                ], AppComponent);
                return AppComponent;
            }());
            exports_1("AppComponent", AppComponent);
        }
    }
});
//# sourceMappingURL=app.component.js.map