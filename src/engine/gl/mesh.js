define(function(require, exports, module){

/*
 * Example:
new exports.Mesh({
    index: ibo,
    vertex: new Float32Array(),
    attributes: {
        position: {
            offset: 0,
            size: 3,
            type: gl.FLOAT,
            stride: 0,
            normalized: false
        }
    },
    mode: gl.TRIANGLES
});

 */
var Mesh = function(gl, options) {
    this.gl = gl;
    this.ibo = options.ibo;
    this.vbo = options.vbo || new Buffer(gl, options.vertex);
    this.mode = options.mode || gl.TRIANGLES;
    if(this.ibo){
        switch(this.ibo.byteLength/this.ibo.length){
            case 1:
                this.iboType = gl.UNSIGNED_BYTE;
                break;
            case 2:
                this.iboType = gl.UNSIGNED_SHORT;
                break;
            case 4:
                this.iboType = gl.UNSIGNED_LONG;
                break;
            default:
                this.iboType = gl.UNSIGNED_SHORT;
                break;
        }
    }
    else{
        this.iboType = 0;
    }
    this.setAttributes(options.attributes);
};
Mesh.prototype = {
    setAttributes: function(attributes) {
        var attributeNames = Object.keys(attributes);
        this.attributes = [];
        this.vertexSize = 0;
        for(var i = 0; i < attributeNames.length; i++) {
            var name = attributeNames[i],
                value = attributes[name],
                attr = {
                    name: name,
                    size: value.size || 3,
                    type: value.type || this.gl.FLOAT,
                    stride: value.stride || 0,
                    offset: value.offset || 0,
                    normalized: !!value.normalized
                };
            this.vertexSize += attr.size;
            this.attributes.push(attr);
        }
    },
    bindAttributes: function(shader) {
        for(var i = 0; i < this.attributes.length; i++) {
            var attr = this.attributes[i],
                location = shader.getAttribLocation(attr.name);
            // should probably be optimized, could leak state
            this.gl.enableVertexAttribArray(location);
            this.gl.vertexAttribPointer(location, attr.size, attr.type, attr.normalized, attr.stride, attr.offset);
        }
    }, 
    draw: function(shader){
        shader.use();
        this.vbo.bind();
        this.bindAttributes(shader);
        if(this.ibo){
            this.ibo.bind();
            this.gl.drawElements(this.mode, this.ibo.length, this.iboType, 0);
        }
        else {
            this.gl.drawArrays(this.mode, 0, this.vbo.length/this.vertexSize);
        }
        this.vbo.unbind();
    }
};
exports.Mesh = Mesh;

var Buffer = function(gl, data, target, mode){
    this.gl = gl;
    this.target = target || gl.ARRAY_BUFFER;
    this.buffer = gl.createBuffer();
    this.bind();
    gl.bufferData(gl.ARRAY_BUFFER, data, mode || gl.STATIC_DRAW);
    this.unbind();
    this.length = data.length;
    this.btyeLength = data.byteLength;
};
Buffer.prototype = {
    bind: function() {
        this.gl.bindBuffer(this.target, this.buffer);
    },
    unbind: function() {
        this.gl.bindBuffer(this.target, null);
    },
    free: function(mode) {
        this.gl.deleteBuffer(this.buffer);
        delete this.buffer;
    }
};
exports.Buffer = Buffer;
   
});
