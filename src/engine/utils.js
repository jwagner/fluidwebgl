if (typeof define !== 'function') { var define = require('amdefine')(module);}
define(function(require, exports, module){
    
var utils = exports;
utils.extend = function extend() {
    var target = arguments[0],
        i, argument, name, f, value;
    for(i = 1; i < arguments.length; i++) {
        argument = arguments[i];
        for(name in argument) {
            target[name] = argument[name];
        }
    }
    return target;
};

utils.debounce = function(f, delay){
    var arguments_, timeout, this_;
    function run(){
        f.apply(this_, arguments_);
    }
    return function(){
        this_ = this;
        arguments_ = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(run, delay);
    };
};

utils.clamp = function clamp(a, b, c) {
    return a < b ? b : (a > c ? c : a);
};

utils.getHashValue = function(name, default_){
    var match = window.location.hash.match('[#,]+' + name + '(=([^,]*))?');
    if(!match){
        return default_;
    }
    return match.length == 3 && match[2] != null ? match[2] : true;
};

});
