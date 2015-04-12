/* jshint devel:true */
'use strict';

var webgl = document.getElementById('webgl');
var uv = document.getElementById('uv');
var drawing = document.getElementById('drawing');
var drawingContext = drawing.getContext('2d');
var textures = [];

// do all the messy work
var gl = setupWebGL(webgl);

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
        // We're keeping track of 2 locations:
        // - clipspace { -1, 1 } for the screen
        // - texture coordinates { 0, 1 } for the texture

        var texCoordLocation = gl.getAttribLocation(program, "a_texCoord");
        var texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.enableVertexAttribArray(texCoordLocation);
        gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
        // two triangles in texture space (0,0) -> (1,1)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0.0,  0.0,
            1.0,  0.0,
            0.0,  1.0,
            0.0,  1.0,
            1.0,  0.0,
            1.0,  1.0]), gl.STATIC_DRAW);


        // provide texture coordinates for the rectangle.
        // TODO: can we use a triangle stripe here?
        // Create a buffer for the position of the rectangle corners.
        var positionLocation = gl.getAttribLocation(program, "a_position");
        var positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        // Set a rectangle the same size as the image.
        var width = webgl.width;
        var height = webgl.height;
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


        // lookup uniforms
        var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
        // set the resolution
        gl.uniform2f(resolutionLocation, webgl.width, webgl.height);

        // create name textures

        textures = [
            {
                name: 'webgl',
                clamping: gl.CLAMP_TO_EDGE,
                interpolation: gl.LINEAR,
                texture: null,
                sampler: null,
                element: webgl
            },
            {
                name: 'drawing',
                clamping: gl.CLAMP_TO_EDGE,
                interpolation: gl.LINEAR,
                texture: null,
                sampler: null,
                element: drawing
            },
            {
                name: 'uv',
                clamping: gl.CLAMP_TO_EDGE,
                interpolation: gl.LINEAR,
                texture: null,
                sampler: null,
                element: uv
            }
        ];

        _.each(textures, function(t, i) {
            // create a new texture
            var texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);

            console.log(t, t.clamping, t.interpolation);
            // Set the parameters so we can render any size image.
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, t.clamping);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, t.clamping);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, t.interpolation);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, t.interpolation);

            // add the texture to the texture info
            t.texture = texture;

            // lookup the sampler locations.
            var u_imageLocation = gl.getUniformLocation(program, "u_image" + t.name);
            // set which texture units to render with.
            gl.uniform1i(u_imageLocation, i);
            t.sampler = u_imageLocation;
            t.id = gl.TEXTURE0 + i;
        });
        // show what we have
        console.log(textures);



        // At init time. Clear the back buffer.
        gl.clearColor(1,1,1,1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // // Turn off rendering to alpha
        gl.colorMask(true, true, true, false);

        function render(){
            // Upload the image into the texture.

            // todo, add u,v images here...
            // things to upload to textures
            _.each(textures, function(t, i){
                gl.activeTexture(t.id);
                gl.bindTexture(gl.TEXTURE_2D, t.texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, t.element);
                // draw rectangle with current texture
                // todo, combine textures, add u,v
            });
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            drawingContext.clearRect(0, 0, drawing.width, drawing.height);
            // Draw the rectangle.
            requestAnimationFrame(render);
        }
        render();
    });



