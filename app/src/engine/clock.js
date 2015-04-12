define(function(require, exports, module){
    
var clock = exports,
    requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;


clock.Clock = function () {
    this.running = false;
    this.interval = null;
    this.t0 = this.now();
    this.t = 0.0;
    this.maxdt = 0.25;
};
clock.Clock.prototype = {
    tick: function () {
        var t1 = this.now(),
            dt = (t1-this.t0)/1000;
        this.t0 = t1;
        this.t += dt;
        // don't tick on frame breaks
        // don't do zero or negative ticks
        if(dt < this.maxdt && dt > 0){
            this.ontick(dt);
        }
    },
    start: function (element) {
        this.running = true;
        var self = this, f;
        if(requestAnimationFrame){
            requestAnimationFrame(f = function () {
                self.tick();
                if(self.running){
                    requestAnimationFrame(f, element);
                }
            }, element);
        }
        else {
            this.interval = window.setInterval(function() {
                self.tick();
            }, 1);
        }
        this.t0 = this.now();
    },
    stop: function() {
        if(this.interval){
            window.clearInterval(this.interval);
            this.interval = null;
        }
        this.running = false;
    },
    now: function(){
        //return new Date();
        return window.performance.now();
    }, 
    ontick: function(dt){
    }
};

clock.fixedstep = function(step, integrate, render){
    var accumulated = 0,
        t = 0;
    return function(dt){
        accumulated += dt;
        while(accumulated >= step){
            integrate(step, t);
            accumulated -= step;
            dt -= step;
            t += step;
        }
        render(dt, t);
    };
};

});
