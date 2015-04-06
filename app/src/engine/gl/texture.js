define(function(require, exports, module){
    
var extend = require('../utils').extend;

exports.Texture2D = function Texture2D(gl, data, options) {
    this.gl = gl;
    this.texture = gl.createTexture();
    this.unit = -1;
    this.bound = false;
    this.bindTexture();

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);

    gl.texImage2D(gl.TEXTURE_2D, 0, options.internalformat || options.format || gl.RGBA, options.format ||  gl.RGBA, options.type || gl.UNSIGNED_BYTE, data);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, options.mag_filter || gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, options.min_filter || gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, options.wrap_s || gl.REPEAT );
    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, options.wrap_t || gl.REPEAT );

    if(options.mipmap !== false){
        gl.generateMipmap(gl.TEXTURE_2D);
    }
};
exports.Texture2D.prototype = {
    bindTexture: function(unit) {
        if(unit !== undefined){
            this.gl.activeTexture(this.gl.TEXTURE0+unit);
            this.unit = unit;
        }
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.bound = true;
    },
    unbindTexture: function() { 
        this.gl.activeTexture(this.gl.TEXTURE0+this.unit);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        this.unit = -1;
        this.bound = false;
    },
    uniform: function (location) {
        this.gl.uniform1i(location, this.unit);
    },
    equals: function(value) {
        return this.unit === value;
    },
    set: function(obj, name) {
        obj[name] = this.unit;
    } 
};

exports.FBO = function FBO(gl, width, height, type, format){
    this.width = width;
    this.height = height;
    this.gl = gl;

    this.framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);

    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, format || gl.RGBA, width, height, 0, format || gl.RGBA, type || gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    this.depth = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.depth);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depth);
    this.supported = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    console.log(arguments, this.supported);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    this.unit = -1;
};
exports.FBO.prototype = extend({}, exports.Texture2D.prototype, {
    bind: function () {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
    },
    unbind: function() {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }
});



});
