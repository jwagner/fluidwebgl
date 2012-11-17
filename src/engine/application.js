define(function(require, exports, module){

var Loader = require('./loader'),
    Clock = require('./clock'),
    context = require('./renderer/gl/context'),
    Scene = require('./scene');

exports.Application = function(canvas){
    var self = this;

    this.canvas = canvas;
    this.gl = context.initialize(canvas, {}, function(el, msg, id){
        self.error(msg);
    });

    this.clock = new Clock();
    this.clock.ontick = function (td) {
        self.tick(td);
    };

    this.loader = new Loader();
    this.resources = this.loader.resources;
    this.context = new context.Context(this.gl, this.resources);

    if(this.gl != null){
        this.loader.load(this.RESOURCES,
            function () { self.ready(); },
            function(loader, error){ self.error(error+'');},
            function(total, pending, failed){ self.status('Loading resources (' + pending + ' / ' + total + ')');}
        );
    }

    this.scene = new Scene(this.gl);
};
exports.Application.prototype = {
    RESOURCES: [
    ],
    ready: function() {
        this.prepare();
        this.clock.start();
    },
    prepare: function() {
        
    },
    draw: function() {
    },
    animate: function(td) {
    },
    tick: function(td) {
        this.draw();
    },
    status: function(message) {
        if(console) console.log(message);
    },
    error: function(message) {
        alert(message);
    },
};
});
