define(function(require, exports, module){
var input = exports,
    clamp = require('engine/utils').clamp;

// mapping keycodes to names
var keyname = {
    32: 'SPACE',
    13: 'ENTER',
    9: 'TAB',
    8: 'BACKSPACE',
    16: 'SHIFT',
    17: 'CTRL',
    18: 'ALT',
    20: 'CAPS_LOCK',
    144: 'NUM_LOCK',
    145: 'SCROLL_LOCK',
    37: 'LEFT',
    38: 'UP',
    39: 'RIGHT',
    40: 'DOWN',
    33: 'PAGE_UP',
    34: 'PAGE_DOWN',
    36: 'HOME',
    35: 'END',
    45: 'INSERT',
    46: 'DELETE',
    27: 'ESCAPE',
    19: 'PAUSE'
};


/* User input handler using jQuery */
input.Handler = function InputHandler(element) {
    this.bind(element);
    this.reset();
};
input.Handler.prototype = {
    offset: {x: 0, y: 0},
    onClick: null,
    onKeyUp: null,
    onKeyDown: null,
    hasFocus: true,
    bind: function(element) {
        var self = this;
        this.element = element;
        this.updateOffset();
        document.addEventListener('keydown', function(e){
            if(!self.keyDown(e.keyCode)){
                e.preventDefault();
            }
        });
        document.addEventListener('keyup', function(e){
            if(!self.keyUp(e.keyCode)){
                e.preventDefault();
            }
        });
        window.addEventListener('click', function(e){
            if(e.target != element){
                self.blur();
            }
            else {
                self.focus();
            }
        });
        window.addEventListener('blur', function (e) {
            self.blur();
        });
        document.addEventListener('mousemove', function(e) {
            self.mouseMove(e.pageX, e.pageY);
        });
        element.addEventListener('mousedown', function (e) {
            self.mouseDown();
        });
        element.addEventListener('mouseup', function (e) {
            self.mouseUp();
        });
        // prevent text selection in browsers that support it
        document.addEventListener('selectstart', function (e) {
            if(self.hasFocus) e.preventDefault();
        });
    },
    updateOffset: function() {
        var offset = this.element.getBoundingClientRect();
        this.offset = {x:offset.left, y:offset.top};
    }, 
    blur: function() {
        this.hasFocus = false;
        this.reset();
    },
    focus: function() {
        if(!this.hasFocus) {
            this.hasFocus = true;
            this.reset();
        }
    },
    reset: function() {
        this.keys = {};
        for(var i = 65; i < 128; i++) {
            this.keys[String.fromCharCode(i)] = false;
        }
        for(i in keyname){
            if(keyname.hasOwnProperty(i)){
                this.keys[keyname[i]] = false;
            }
        }
        this.mouse = {down: false, x: 0, y: 0};
    },
    keyDown: function(key) {
        var name = this._getKeyName(key),
            wasDown = this.keys[name];
        this.keys[name] = true;
        if(this.onKeyDown && !wasDown) {
            this.onKeyDown(name);
        }
        return this.hasFocus;
    },
    keyUp: function(key) {
        var name = this._getKeyName(key);
        this.keys[name] = false;
        if(this.onKeyUp) {
            this.onKeyUp(name);
        }
        return this.hasFocus;
    },
    mouseDown: function() {
        this.mouse.down = true;
    },
    mouseUp: function() {
        this.mouse.down = false;
        if(this.hasFocus && this.onClick) {
            this.onClick(this.mouse.x, this.mouse.y);
        }
    },
    mouseMove: function(x, y){
        this.mouse.x = clamp(x-this.offset.x, 0, this.width);
        this.mouse.y = clamp(y-this.offset.y, 0, this.height);
    },
    _getKeyName: function(key) {
        if(key in keyname) {
            return keyname[key];
        }
        return String.fromCharCode(key);
    }
 
};
});
