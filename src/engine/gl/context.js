define(function(require, exports, module){

var mesh = require('./mesh'),
    texture = require('./texture'),
    extend = require('../utils').extend,
    shader = require('./shader');

require('./_webgl-debug');

exports.Context = function(gl, resources){
    this.gl = gl;
    this.resources = resources;
    this.shaderManager = new shader.Manager(resources);
};
exports.Context.prototype = {
    // factories
    getBuffer: function(name, target, mode) {
        var data = this.resources[name];
        new mesh.Buffer(this.gl, data, target, mode);
    },
    getFBO: function() {
        
    },
    getTexture: function(name, options) {
        var image = this.resources[name];
        return new texture.Texture2D(this.gl, image, options);
    },
    getShader: function(name){
    } 
};

function log_error(el, msg, id){
    if(window.console && window.console.error) console.error(id, msg);
}
    
exports.initialize = function (canvas, options, onerror) {
    var upgrade = 'Try upgrading to the latest version of firefox or chrome.';

    onerror = onerror || log_error;

    if(!canvas.getContext){
        onerror(canvas, 'canvas is not supported by your browser. ' +
             upgrade, 'no-canvas');
        return;
    }


    var context_options = extend({
            alpha: false,
            depth: true,
            stencil: false,
            antialias: true,
            premultipliedAlpha: false,
            preserveDrawingBuffer: false
        }, options.context),
        extensions = options.extensions || {};

    var gl = canvas.getContext('webgl', context_options);
    if(gl == null){
        gl = canvas.getContext('experimental-webgl', context_options);
        if(gl == null){
            onerror(canvas, 'webgl is not supported by your browser. ' +
                 upgrade, 'no-webgl');
            return;
        }
    }

    if(options.vertex_texture_units && gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) < options.vertex_texture_units){
        onerror(canvas, 'This application needs at least two vertex texture units which are not supported by your browser. ' +
              upgrade, 'no-vertext-texture-units');
        return;
    }

    if(extensions.texture_float && gl.getExtension('OES_texture_float') == null){
        onerror(canvas, 'This application needs float textures which is not supported by your browser. ' +
                upgrade, 'no-OES_texture_float');
        return;
    }

    if(extensions.standard_derivatives && gl.getExtension('OES_standard_derivatives') == null){
        onerror(canvas, 'This application need the standard deriviates extensions for WebGL which is not supported by your Browser.' +
                upgrade, 'no-OES_standard_derivatives');

    }

    if(window.WebGLDebugUtils && options.debug){
        if(options.log_all){
            gl = WebGLDebugUtils.makeDebugContext(gl, undefined, function(){
                console.log.apply(console, arguments);
            });
        }
        else {
            gl = WebGLDebugUtils.makeDebugContext(gl);
        }
        console.log('running in debug context');
    }

    if(context_options.depth){
        gl.enable(gl.DEPTH_TEST);
    }
    else {
        gl.disable(gl.DEPTH_TEST);
    }
    gl.enable(gl.CULL_FACE);

    gl.lost = false;
    canvas.addEventListener('webglcontextlost', function () {
        onerror(canvas, 'Lost webgl context!', 'context-lost');
        gl.lost = true;
    }, false);
    //canvas.addEventListener('webglcontextrestored', function () {
        //onerror(canvas, 'restored webgl context - reloading!');
        //window.location.reload();
    //}, false);

    return gl;
};

});
