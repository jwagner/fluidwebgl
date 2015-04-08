var COLOURS = [ '#E3EB64', '#A7EBCA', '#FFFFFF', '#D8EBA7', '#868E80' ];
var radius = 0;
Sketch.create({
    container: document.getElementById('draw'),
    autoclear: false,
    setup: function() {
        console.log( 'setup' );
    },
    update: function() {
        radius = 2 + abs( sin( this.millis * 0.003 ) * 10 );
    },
    // Event handlers
    keydown: function() {
        if ( this.keys.C ) this.clear();
    },
    // Mouse & touch events are merged, so handling touch events by default
    // and powering sketches using the touches array is recommended for easy
    // scalability. If you only need to handle the mouse / desktop browsers,
    // use the 0th touch element and you get wider device support for free.
    touchmove: function() {
        for ( var i = this.touches.length - 1, touch; i >= 0; i-- ) {
            touch = this.touches[i];
            this.lineCap = 'round';
            this.lineJoin = 'round';
            this.fillStyle = this.strokeStyle = COLOURS[ Math.floor(Math.random() * COLOURS.length) ];
            this.lineWidth = radius;
            this.beginPath();
            this.moveTo( touch.ox, touch.oy );
            this.lineTo( touch.x, touch.y );
            this.stroke();
        }
    }
});
