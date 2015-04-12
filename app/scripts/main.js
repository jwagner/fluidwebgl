/* jshint devel:true */
'use strict';

var webgl = document.getElementById('webgl');
var uv = document.getElementById('uv');
var drawing = document.getElementById('drawing');
var drawingContext = drawing.getContext('2d');
var textures = [];
var render;

// do all the messy work
var gl = setupWebGL(webgl, {preserveDrawingBuffer: true});

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

        // non pre-multiplied alpha textures.
        // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        // provide texture coordinates for the rectangle.
        // Create a buffer for the position of the rectangle corners.
        // The position is in scale 0,1
        var positionLocation = gl.getAttribLocation(program, "a_position");
        var positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        // Set a rectangle to the (0,1) domain
        var x1 = 0;
        var x2 = 0 + 1.0;
        var y1 = 0;
        var y2 = 0 + 1.0;
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            x1, y1,
            x2, y1,
            x1, y2,
            x1, y2,
            x2, y1,
            x2, y2]), gl.STATIC_DRAW);


        // lookup canvas size location
        var webglSizeLocation = gl.getUniformLocation(program, "u_webglSize");
        // set the texture size
        gl.uniform2f(webglSizeLocation, webgl.width, webgl.height);

        // create name textures

        textures = [
            {
                name: 'webgl',
                clamping: gl.CLAMP_TO_EDGE,
                interpolation: gl.LINEAR,
                texture: null,
                sampler: null,
                fbo: null,
                element: webgl,
                width: webgl.width,
                height: webgl.height
            },
            {
                name: 'drawing',
                clamping: gl.CLAMP_TO_EDGE,
                interpolation: gl.LINEAR,
                texture: null,
                sampler: null,
                fbo: null,
                element: drawing,
                width: drawing.width,
                height: drawing.height
            },
            {
                name: 'uv',
                clamping: gl.CLAMP_TO_EDGE,
                interpolation: gl.LINEAR,
                texture: null,
                sampler: null,
                fbo: null,
                element: uv,
                width: uv.width,
                height: uv.height
            }
        ];

        _.each(textures, function(t, i) {
            // create a new texture
            var texture = gl.createTexture();
            t.id = gl.TEXTURE0 + i;
            // draw rectangle with current texture
            gl.activeTexture(t.id);
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
        });
        // show what we have
        console.log(textures);


        var framebuffers = [
            {
                name: 'fbo0',
                clamping: gl.CLAMP_TO_EDGE,
                interpolation: gl.NEAREST,
                texture: null,
                sampler: null,
                fbo: null,
                element: webgl,
                width: webgl.width,
                height: webgl.height
            },
            {
                name: 'fbo1',
                clamping: gl.CLAMP_TO_EDGE,
                interpolation: gl.NEAREST,
                texture: null,
                sampler: null,
                fbo: null,
                element: webgl,
                width: webgl.width,
                height: webgl.height
            }
        ]

        // Create a framebuffer
        _.each(framebuffers, function(t, i){
            // create a texture to draw on
            var texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);

            // Set the parameters so we can render any size image.
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, t.clamping);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, t.clamping);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, t.interpolation);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, t.interpolation);

            t.texture = texture;

            // make an empty texture the same size as the webgl context
            gl.texImage2D(
                gl.TEXTURE_2D, 0, gl.RGBA, webgl.width, webgl.height, 0,
                gl.RGBA, gl.UNSIGNED_BYTE, null
            );

            // lookup the sampler locations.
            var u_imageLocation = gl.getUniformLocation(program, "u_image" + t.name);
            // texture unit 0
            gl.uniform1i(u_imageLocation, i + textures.length);
            t.id = gl.TEXTURE0 + i + textures.length;

            var fbo = gl.createFramebuffer();
            t.fbo = fbo;
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

            // Attach a texture to it.
            gl.framebufferTexture2D(
                gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t.texture, 0
            );

        });
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // At init time. Clear the back buffer.
        // gl.clearColor(1.0, 1.0, 1.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // // Turn off rendering to alpha
        // gl.colorMask(true, true, true, true);
        var i = 0;
        render = function(){
            // upload all the current textures
            // gl.clear(gl.COLOR_BUFFER_BIT);
            i += 1;
            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[0].fbo);
            // console.log(framebuffers[0].fbo);
            // console.log('loading texture', t, i);
            var webglTexture = textures[0];
            gl.bindTexture(gl.TEXTURE_2D, webglTexture.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, webglTexture.element);

            // draw webgl texture in fbo0
            gl.drawArrays(gl.TRIANGLES, 0, 6);

            // switch to drawing buffer
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            var drawingTexture = textures[1];
            gl.bindTexture(gl.TEXTURE_2D, drawingTexture.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, drawingTexture.element);

            var uvTexture = textures[2];
            gl.bindTexture(gl.TEXTURE_2D, uvTexture.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, uvTexture.element);

            gl.drawArrays(gl.TRIANGLES, 0, 6);
            drawingContext.clearRect(0, 0, drawing.width, drawing.height);

            // Draw the rectangle.
            requestAnimationFrame(render);
        }
        console.log(textures);
        render();
    });



