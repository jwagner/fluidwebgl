define(function(require, exports, module){
    
exports.grid = function(size){
    var buffer = new Float32Array(size*size*6*3),
        i = 0,
        half = size * 0.5;

    for(var y = 0; y < size; y++){
        for(var x = 0; x < size; x++) {
            buffer[i++] = x/size;
            buffer[i++] = 0;
            buffer[i++] = y/size;

            buffer[i++] = x/size;
            buffer[i++] = 0;
            buffer[i++] = (y+1)/size;

            buffer[i++] = (x+1)/size;
            buffer[i++] = 0;
            buffer[i++] = (y+1)/size;

            buffer[i++] = x/size;
            buffer[i++] = 0;
            buffer[i++] = y/size;

            buffer[i++] = (x+1)/size;
            buffer[i++] = 0;
            buffer[i++] = (y+1)/size;

            buffer[i++] = (x+1)/size;
            buffer[i++] = 0;
            buffer[i++] = y/size;
        }
    }
    return buffer;
};

// convert a gl.TRIANGLES mesh into a wireframe for rendering with gl.LINES
exports.wireFrame = function(input){
    var output = new Float32Array(input.length*2),
        triangles = input.length/9;
    for(var t = 0; t < triangles; t++) {
        for(var v1 = 0; v1 < 3; v1++) {
            var v2 = (v1+1)%3;
            for(var i = 0; i < 3; i++) {
                output[t*18+v1*3+i] = input[t*9+v1*3+i];
                output[t*18+v1*3+9+i] = input[t*9+v2*3+i];
            }
        }
    }
    return output;
}; 

exports.screen_quad = function screen_quad(xscale, yscale) {
    xscale = xscale||1;
    yscale = yscale||xscale;
    return new Float32Array([
            -xscale, yscale, 0,
            -xscale, -yscale, 0,
            xscale, -yscale, 0,
            
            -xscale, yscale, 0,
            xscale, -yscale, 0,
            xscale, yscale, 0
    ]);
};

exports.cube = function cube(scale) {
    scale = scale || 1;
    return new Float32Array([
            // back
            scale, scale, scale,
            scale, -scale, scale,
            -scale, -scale, scale,
            
            scale, scale, scale,
            -scale, -scale, scale,
            -scale, scale, scale,

            // front
            -scale, scale, -scale,
            -scale, -scale, -scale,
            scale, scale, -scale,
            
            scale, scale, -scale,
            -scale, -scale, -scale,
            scale, -scale, -scale,
            // left
            -scale, scale, scale,
            -scale, -scale, -scale,
            -scale, scale, -scale,
            
            -scale, scale, scale,
            -scale, -scale, scale,
            -scale, -scale, -scale,

            // right

            scale, scale, scale,
            scale, scale, -scale,
            scale, -scale, -scale,
            
            scale, scale, scale,
            scale, -scale, -scale,
            scale, -scale, scale,

            // top
            scale, scale, scale,
            -scale, scale, scale,
            -scale, scale, -scale,

            scale, scale, -scale,
            scale, scale, scale,
            -scale, scale, -scale,

            // bottom
            -scale, -scale, -scale,
            -scale, -scale, scale,
            scale, -scale, scale,

            -scale, -scale, -scale,
            scale, -scale, scale,
            scale, -scale, -scale
        ]);
};

});
