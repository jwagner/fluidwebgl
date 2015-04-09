/* jshint devel:true */
'use strict';

var canvas = document.getElementById('c');

// do all the messy work
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


// When both vertex and fragment source are retrieved call the
Promise.all([vertexSource, fragmentSource])
    .then(function(sources){
        // Setup the program, from the two downloaded sources
        var program = createProgramFromSources(gl, sources);
        // set this program as the current program
        gl.useProgram(program);

        // look up where the vertex data needs to go.
        var positionLocation = gl.getAttribLocation(program, "a_position");
        var texCoordLocation = gl.getAttribLocation(program, "a_texCoord");

        // provide texture coordinates for the rectangle.
        // TODO: can we use a triangle stripe here?
        var texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        // two triangles in texture space (0,0) -> (1,1)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0.0,  0.0,
            1.0,  0.0,
            0.0,  1.0,
            0.0,  1.0,
            1.0,  0.0,
            1.0,  1.0]), gl.STATIC_DRAW);
        //
        gl.enableVertexAttribArray(texCoordLocation);
        gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

        // create 2 textures
        var textures = [];
        for (var ii = 0; ii < 2; ++ii) {
            var texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);

            // Set the parameters so we can render any size image.
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

            // add the texture to the array of textures.
            textures.push(texture);
        }

        // lookup the sampler locations.
        var u_image0Location = gl.getUniformLocation(program, "u_image0");
        var u_image1Location = gl.getUniformLocation(program, "u_image1");
        // set which texture units to render with.
        gl.uniform1i(u_image0Location, 0);  // texture unit 0
        gl.uniform1i(u_image1Location, 1);  // texture unit 1

        console.log(textures);

        // lookup uniforms
        var resolutionLocation = gl.getUniformLocation(program, "u_resolution");

        // set the resolution
        gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

        // Create a buffer for the position of the rectangle corners.
        var buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        // Set a rectangle the same size as the image.
        var width = canvas.width;
        var height = canvas.height;
        var x1 = 0;
        var x2 = 0 + width;
        var y1 = 0;
        var y2 = 0 + height;
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            x1, y1,
            x2, y1,
            x1, y2,
            x1, y2,
            x2, y1,
            x2, y2]), gl.STATIC_DRAW);
        var drawing = document.getElementById('draw').getElementsByTagName('canvas')[0];
        var ctx2d = drawing.getContext('2d');

        // At init time. Clear the back buffer.
        gl.clearColor(1,1,1,1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Turn off rendering to alpha
        gl.colorMask(true, true, true, false);

        function render(){
            // Upload the image into the texture.

            // todo, add u,v images here...
            // things to upload to textures
            var canvi = [drawing, canvas];

            for (var ii = 0; ii < 2; ++ii) {
                gl.activeTexture(gl.TEXTURE0 + ii);
                gl.bindTexture(gl.TEXTURE_2D, textures[ii]);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvi[ii]);
                // draw rectangle with current texture
                // todo, combine textures, add u,v
                gl.drawArrays(gl.TRIANGLES, 0, 6);
                ctx2d.clearRect(0, 0, drawing.width, drawing.height);
            }
            // Draw the rectangle.
            requestAnimationFrame(render);
        }
        render();
    });



