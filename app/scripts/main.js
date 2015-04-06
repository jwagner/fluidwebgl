/* jshint devel:true */
var canvas = document.getElementById('c')
var gl = setupWebGL(canvas);

// download vertex source
var vertex = document.getElementById('vertex');
var vertexSource = fetch(vertex.src)
        .then(function(response) {
            return response.text();
        }).then(function(body) {
            return body;
        });

// download fragment source
var fragment = document.getElementById('fragment');
var fragmentSource = fetch(fragment.src)
        .then(function(response) {
            return response.text();
        }).then(function(body) {
            return body;
        });

// var image = document.getElementById('texture');
// var imageBlob = fetch(image.src)
//         .then(function(response) {
//             return response.text();
//         }).then(function(body) {
//             return body;
//         });


// When both vertex and fragment source are retrieved call the
Promise.all([vertexSource, fragmentSource])
    .then(function(sources){
        var program = createProgramFromSources(gl, sources);
        gl.useProgram(program);

        // look up where the vertex data needs to go.
        var positionLocation = gl.getAttribLocation(program, "a_position");

        // lookup where the resolution is stored.
        var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
        gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

        // Create a buffer and put a single pixelspace rectangle in
        // it (2 triangles)
        var buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

        // setup a rectangle full width
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0, 0,
            canvas.width, 0,
            0, canvas.height,
            0, canvas.height,
            canvas.width, 0,
            canvas.width, canvas.height]), gl.STATIC_DRAW);

        // Associate the buffer with the positions
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        var texCoordLocation = gl.getAttribLocation(program, "a_texCoord");
        gl.enableVertexAttribArray(texCoordLocation);
        gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

        // draw the 2 triangles
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    });




