/**
 * @fileoverview game-shim - Shims to normalize gaming-related APIs to their respective specs
 * @author Brandon Jones
 * @version 0.9
 */

/*
 * Copyright (c) 2012 Brandon Jones
 *
 * This software is provided 'as-is', without any express or implied
 * warranty. In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 *    1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgment in the product documentation would be
 *    appreciated but is not required.
 *
 *    2. Altered source versions must be plainly marked as such, and must not
 *    be misrepresented as being the original software.
 *
 *    3. This notice may not be removed or altered from any source
 *    distribution.
 */

(function(global) {

    var elementPrototype = (global.HTMLElement || global.Element)["prototype"];
    var getter;

    var GameShim = global.GameShim = {
        supports: {
            fullscreen: true,
            pointerLock: true,
            gamepad: true,
            highResTimer: true
        }
    };
    
    //=====================
    // Animation
    //=====================
    
    // window.requestAnimaionFrame, credit: Erik Moller
    // http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
    (function() {
        var lastTime = 0;
        var vendors = ["webkit", "moz", "ms", "o"];
        var x;

        for(x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
            window.requestAnimationFrame = window[vendors[x]+"RequestAnimationFrame"];
        }

        window.cancelAnimationFrame = window.cancelAnimationFrame || window.cancelRequestAnimationFrame; // Check for older syntax
        for(x = 0; x < vendors.length && !window.cancelAnimationFrame; ++x) {
            window.cancelAnimationFrame = window[vendors[x]+"CancelAnimationFrame"] || window[vendors[x]+"CancelRequestAnimationFrame"];
        }

        // Manual fallbacks
        if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = function(callback, element) {
                var currTime = Date.now();
                var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                var id = window.setTimeout(function() { callback(currTime + timeToCall); },
                  timeToCall);
                lastTime = currTime + timeToCall;
                return id;
            };
        }

        if (!window.cancelAnimationFrame) {
            window.cancelAnimationFrame = function(id) {
                clearTimeout(id);
            };
        }
        
        // window.animationStartTime
        if(!window.animationStartTime) {
            getter = (function() {
                for(x = 0; x < vendors.length; ++x) {
                    if(window[vendors[x] + "AnimationStartTime"]) {
                        return function() { return window[vendors[x] + "AnimationStartTime"]; };
                    }
                }

                return function() { return Date.now(); };
            })();

            Object.defineProperty(window, "animationStartTime", {
                enumerable: true, configurable: false, writeable: false,
                get: getter
            });
        }
    }());
    
    //=====================
    // Fullscreen
    //=====================
    
    // document.fullscreenEnabled
    if(!document.hasOwnProperty("fullscreenEnabled")) {
        getter = (function() {
            // These are the functions that match the spec, and should be preferred
            if("webkitIsFullScreen" in document) {
                return function() { return webkitRequestFullScreen in document; };
            }
            if("mozFullScreenEnabled" in document) {
                return function() { return document.mozFullScreenEnabled; };
            }

            GameShim.supports.fullscreen = false;
            return function() { return false; }; // not supported, never fullscreen
        })();
        
        Object.defineProperty(document, "fullscreenEnabled", {
            enumerable: true, configurable: false, writeable: false,
            get: getter
        });
    }
    
    if(!document.hasOwnProperty("fullscreenElement")) {
        getter = (function() {
            // These are the functions that match the spec, and should be preferred
            var i=0, name=["webkitCurrentFullScreenElement", "webkitFullscreenElement", "mozFullScreenElement"];
            for (; i<name.length; i++)
            {
                if (name[i] in document)
                {
                    return function() { return document[name[i]]; };
                }
            }
            return function() { return null; }; // not supported
        })();
        
        Object.defineProperty(document, "fullscreenElement", {
            enumerable: true, configurable: false, writeable: false,
            get: getter
        });
    }
    
    // Document event: fullscreenchange
    function fullscreenchange(oldEvent) {
        var newEvent = document.createEvent("CustomEvent");
        newEvent.initCustomEvent("fullscreenchange", true, false, null);
        // TODO: Any need for variable copy?
        document.dispatchEvent(newEvent);
    }
    document.addEventListener("webkitfullscreenchange", fullscreenchange, false);
    document.addEventListener("mozfullscreenchange", fullscreenchange, false);
    
    // Document event: fullscreenerror
    function fullscreenerror(oldEvent) {
        var newEvent = document.createEvent("CustomEvent");
        newEvent.initCustomEvent("fullscreenerror", true, false, null);
        // TODO: Any need for variable copy?
        document.dispatchEvent(newEvent);
    }
    document.addEventListener("webkitfullscreenerror", fullscreenerror, false);
    document.addEventListener("mozfullscreenerror", fullscreenerror, false);
    
    // element.requestFullScreen
    if(!elementPrototype.requestFullscreen) {
        elementPrototype.requestFullscreen = (function() {
            if(elementPrototype.webkitRequestFullScreen) {
                return function() {
                    this.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
                };
            }

            if(elementPrototype.mozRequestFullScreen) {
                return function() {
                    this.mozRequestFullScreen();
                };
            }
            
            return function(){ /* unsupported, fail silently */ };
        })();
    }
    
    // document.exitFullscreen
    if(!document.exitFullscreen) {
        document.exitFullscreen = (function() {
            return  document.webkitExitFullscreen ||
                    document.mozCancelFullScreen ||
                    function(){ /* unsupported, fail silently */ };
        })();
    }
    
    //=====================
    // Pointer Lock
    //=====================
    
    var mouseEventPrototype = global.MouseEvent.prototype;
    
    if(!("movementX" in mouseEventPrototype)) {
        Object.defineProperty(mouseEventPrototype, "movementX", {
            enumerable: true, configurable: false, writeable: false,
            get: function() { return this.webkitMovementX || this.mozMovementX || 0; }
        });
    }
    
    if(!("movementY" in mouseEventPrototype)) {
        Object.defineProperty(mouseEventPrototype, "movementY", {
            enumerable: true, configurable: false, writeable: false,
            get: function() { return this.webkitMovementY || this.mozMovementY || 0; }
        });
    }
    
    // Navigator pointer is not the right interface according to spec.
    // Here for backwards compatibility only
    if(!navigator.pointer) {
        navigator.pointer = navigator.webkitPointer || navigator.mozPointer;
    }

    // Document event: pointerlockchange
    function pointerlockchange(oldEvent) {
        var newEvent = document.createEvent("CustomEvent");
        newEvent.initCustomEvent("pointerlockchange", true, false, null);
        document.dispatchEvent(newEvent);
    }
    document.addEventListener("webkitpointerlockchange", pointerlockchange, false);
    document.addEventListener("webkitpointerlocklost", pointerlockchange, false);
    document.addEventListener("mozpointerlockchange", pointerlockchange, false);
    document.addEventListener("mozpointerlocklost", pointerlockchange, false);

    // Document event: pointerlockerror
    function pointerlockerror(oldEvent) {
        var newEvent = document.createEvent("CustomEvent");
        newEvent.initCustomEvent("pointerlockerror", true, false, null);
        document.dispatchEvent(newEvent);
    }
    document.addEventListener("webkitpointerlockerror", pointerlockerror, false);
    document.addEventListener("mozpointerlockerror", pointerlockerror, false);
    
    if(!document.hasOwnProperty("pointerLockElement")) {
        getter = (function() {
            // These are the functions that match the spec, and should be preferred
            if("webkitPointerLockElement" in document) {
                return function() { return document.webkitPointerLockElement; };
            }
            if("mozPointerLockElement" in document) {
                return function() { return document.mozPointerLockElement; };
            }
            return function() { return null; }; // not supported
        })();
        
        Object.defineProperty(document, "pointerLockElement", {
            enumerable: true, configurable: false, writeable: false,
            get: getter
        });
    }
    
    // element.requestPointerLock
    if(!elementPrototype.requestPointerLock) {
        elementPrototype.requestPointerLock = (function() {
            if(elementPrototype.webkitRequestPointerLock) {
                return function() {
                    this.webkitRequestPointerLock();
                };
            }

            if(elementPrototype.mozRequestPointerLock) {
                return function() {
                    this.mozRequestPointerLock();
                };
            }

            if(navigator.pointer) {
                return function() {
                    var elem = this;
                    navigator.pointer.lock(elem, pointerlockchange, pointerlockerror);
                };
            }

            GameShim.supports.pointerLock = false;

            return function(){}; // not supported
        })();
    }
    
    // document.exitPointerLock
    if(!document.exitPointerLock) {
        document.exitPointerLock = (function() {
            return  document.webkitExitPointerLock ||
                    document.mozExitPointerLock ||
                    function(){
                        if(navigator.pointer) {
                            var elem = this;
                            navigator.pointer.unlock();
                        }
                    };
        })();
    }
    
    //=====================
    // Gamepad
    //=====================
    
    if(!navigator.gamepads) {
        getter = (function() {
            // These are the functions that match the spec, and should be preferred
            if("webkitGamepads" in navigator) {
                return function() { return navigator.webkitGamepads; };
            }
            if("mozGamepads" in navigator) {
                return function() { return navigator.mozGamepads; };
            }
            
            GameShim.supports.gamepad = false;
            var gamepads = [];
            return function() { return gamepads; }; // not supported, return empty array
        })();
        
        Object.defineProperty(navigator, "gamepads", {
            enumerable: true, configurable: false, writeable: false,
            get: getter
        });
    }

    //=======================
    // High Resolution Timer
    //=======================

    if(!window.performance) {
        window.performance = {};
    }

    if(!window.performance.timing) {
        window.performance.timing = {
            navigationStart: Date.now() // Terrible approximation, I know. Sorry.
        };
    }

    if(!window.performance.now) {
        window.performance.now = (function() {
            // FYI: Mozilla supports high-res timers without prefixes.

            if(window.performance.webkitNow) {
                return window.performance.webkitNow;
            }

            GameShim.supports.highResTimer = false;

            return function(){ // not supported, return a low-resolution approximation
                return Date.now() - window.performance.timing.navigationStart;
            };
        })();
    }
    
})((typeof(exports) != 'undefined') ? global : window); // Account for CommonJS environments
