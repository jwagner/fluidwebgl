define(function(require, exports, module){

function keys(o){
    var a = [];
    for(var name in o){
        a.push(name);
    }
    return a;
}

function Shader(gl, vertexSource, fragmentSource) {
    this.gl = gl;
    this.program = this.makeProgram(vertexSource, fragmentSource);
    this.uniformLocations = {};
    this.uniformValues = {};
    this.uniformNames = [];
    this.attributeLocations = {};
}
Shader.prototype = {
    use: function() {
        this.gl.useProgram(this.program);
    },
    prepareUniforms: function(values) {
        this.uniformNames = keys(values);
        for(var i = 0; i < this.uniformNames.length; i++) {
            var name = this.uniformNames[i];
            this.uniformLocations[name] = this.gl.getUniformLocation(this.program, name);
        }
    }, 
    uniforms: function (values) {
        if(this.uniformNames.length === 0){
            this.prepareUniforms(values);
        }
        for(var i = 0; i < this.uniformNames.length; i++) {
            var name = this.uniformNames[i];
            
            var location = this.uniformLocations[name],
                value = values[name];

            if(location === null) continue;

            if(value.uniform){
                if(!value.equals(this.uniformValues[name])){
                    value.uniform(location);
                    value.set(this.uniformValues, name);
                }
            }
            else if(value.length){
                var value2 = this.uniformValues[name];
                if(value2 !== undefined){
                    for(var j = 0, l = value.length; j < l; j++) {
                        if(value[j] != value2[j]) break;
                    }
                    // already set
                    if(j == l) {
                        //continue;
                    }
                    else {
                        for(j = 0, l = value.length; j < l; j++) {
                            value2[j] = value[j];
                        }
                    }
                }
                else {
                    this.uniformValues[name] = new Float32Array(value);
                }
                switch(value.length){
                    case 2:
                        this.gl.uniform2fv(location, value);
                        break;
                    case 3:
                        this.gl.uniform3fv(location, value);
                        break;
                    case 4:
                        this.gl.uniform4fv(location, value);
                        break;
                    case 9:
                        this.gl.uniformMatrix3fv(location, false, value);
                        break;
                    case 16:
                        this.gl.uniformMatrix4fv(location, false, value);
                        break;

                }
            }
            else {
                if(value != this.uniformValues[name]){
                    this.gl.uniform1f(location, value);
                    this.uniformValues[name] = value;
                }

            }
        }
    },
    getUniformLocation: function(name) {
        if(this.uniformLocations[name] === undefined){
            this.uniformLocations[name] = this.gl.getUniformLocation(this.program, name);
        }
        return this.uniformLocations[name];
    },
    getAttribLocation: function(name) {
        if(!(name in this.attributeLocations)){
            var location = this.gl.getAttribLocation(this.program, name);
            if(location < 0){
                throw 'undefined attribute ' + name;
            }
            this.attributeLocations[name] = location;
        }
        return this.attributeLocations[name];
    },
    makeShader: function(shaderType, source){
        var shader = this.gl.createShader(shaderType);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if(!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)){
            console.log(this.gl.getShaderInfoLog(shader), shaderType, source);
            throw 'Compiler exception: "' + this.gl.getShaderInfoLog(shader) + '"';
        }
        return shader;
    },
    makeProgram: function(vertexSource, fragmentSource){
        var vertexShader = this.makeShader(this.gl.VERTEX_SHADER, vertexSource),
            fragmentShader = this.makeShader(this.gl.FRAGMENT_SHADER, fragmentSource),
            program = this.gl.createProgram();

        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        if(!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)){
            throw 'Linker exception: ' + this.gl.getProgramInfoLog(program);
        }

        return program;
    }
};
exports.Shader = Shader;

exports.Manager = function ShaderManager(gl, resources, options){
    this.gl = gl;
    this.resources = resources;
    this.shaders = [];
    options = options || {};
    this.prefix = options.prefix || 'shaders/';
};
exports.Manager.prototype = {
    //prefix: 'shaders/',
    includeExpression: /#include "([^"]+)"/g,
    preprocess: function(name, content) {
        return content.replace(this.includeExpression, function (_, name) {
            return this.getSource(name);
        }.bind(this));
    },
    getSource: function(name) {
        var content = this.resources[this.prefix + name];
        if(content == null) {
            throw 'shader not found: ' + name;
        }
        return this.preprocess(name, content);
    },
    get: function(vertex, frag) {
        if(!frag) {
            frag = vertex;
        }
        frag += '.frag';
        vertex += '.vertex';
        var key = frag + ';' + vertex;
        if(!(key in this.shaders)){
            this.shaders[key] = new Shader(this.gl, this.getSource(vertex), this.getSource(frag));
        }
        return this.shaders[key];
    }
};

});
