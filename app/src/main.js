define(function(require, exports, module){
require('game-shim');
require('dat.gui');
// only when optimized

var Loader = require('engine/loader'),
    Clock = require('engine/clock').Clock,
    InputHandler = require('engine/input').Handler,
    debounce = require('engine/utils').debounce,
    ShaderManager = require('engine/gl/shader').Manager,
    geometry = require('engine/gl/geometry'),
    FBO = require('engine/gl/texture').FBO,
    Mesh = require('engine/gl/mesh').Mesh,
    glcontext = require('engine/gl/context'),
    glm = require('gl-matrix'),
    ComputeKernel = require('compute').Kernel,
    vec2 = glm.vec2;

var canvas = document.getElementById('c'),
    gl = glcontext.initialize(canvas, {
        context: {
            depth: false
        },
        debug: false,
        //log_all: true,
        extensions: {
            texture_float: true
        }
    }, fail),
    options = {
        iterations: 32,
        mouse_force: 1,
        resolution: 0.5,
        cursor_size: 100,
        step: 1/60
    },
    gui = new dat.GUI(),
    clock = new Clock(canvas),
    input = new InputHandler(canvas),
    loader = new Loader(),
    resources = loader.resources,
    shaders = new ShaderManager(gl, resources);

window.gl = gl;

function fail(el, msg, id) {
    document.getElementById('video').style.display = 'block';
}

function hasFloatLuminanceFBOSupport(){
    var fbo = new FBO(gl, 32, 32, gl.FLOAT, gl.LUMINANCE);
    return fbo.supported;
}

function init(){
    // just load it when it's there. If it's not there it's hopefully not needed.
    gl.getExtension('OES_texture_float_linear');
    var format = hasFloatLuminanceFBOSupport() ? gl.LUMINANCE : gl.RGBA,
        onresize;
    window.addEventListener('resize', debounce(onresize = function(){
        var rect = canvas.getBoundingClientRect(),
            width = rect.width * options.resolution,
            height = rect.height * options.resolution;
        //console.log(rect.width, rect.height);
        //if(rect.width != canvas.width || rect.height != canvas.height){
            input.updateOffset();
            setup(width, height, format);
        //}
    }, 250));
    gui.add(options, 'iterations', 2, 128).step(2);
    gui.add(options, 'mouse_force', 1, 100).step(1);
    gui.add(options, 'cursor_size', 8, 1000).step(1).onFinishChange(onresize);
    gui.add(options, 'resolution', {'quarter': 0.25, 'half': 0.5, full: 1.0, double: 2.0, quadruple: 4.0}).onFinishChange(onresize);
    gui.add(options, 'step', {'1/1024': 1/1024, '1/240': 1/240, '1/120': 1/120, '1/60': 1/60, '1/30': 1/30, '1/10': 1/10});
    gui.close();
    onresize();
    clock.start();
}

function setup(width, height, singleComponentFboFormat){
    canvas.width = width,
    canvas.height = height;

    gl.viewport(0, 0, width, height);
    gl.lineWidth(1.0);

    var px_x = 1.0/canvas.width,
        px_y = 1.0/canvas.height,
        px = vec2.create([px_x, px_y]);
        px1 = vec2.create([1, canvas.width/canvas.height]),
        inside = new Mesh(gl, {
            vertex: geometry.screen_quad(1.0-px_x*2.0, 1.0-px_y*2.0),
            attributes: {
                position: {}
            }
        }),
        all = new Mesh(gl, {
            vertex: geometry.screen_quad(1.0, 1.0),
            attributes: {
                position: {}
            }
        }),
        boundary = new Mesh(gl, {
            mode: gl.LINES,
            vertex: new Float32Array([
                // bottom
                -1+px_x*0.0, -1+px_y*0.0,
                -1+px_x*0.0, -1+px_y*2.0,

                 1-px_x*0.0, -1+px_y*0.0,
                 1-px_x*0.0, -1+px_y*2.0,

                // top
                -1+px_x*0.0,  1-px_y*0.0,
                -1+px_x*0.0,  1-px_y*2.0,

                 1-px_x*0.0,  1-px_y*0.0,
                 1-px_x*0.0,  1-px_y*2.0,

                // left
                -1+px_x*0.0,  1-px_y*0.0,
                -1+px_x*2.0,  1-px_y*0.0,

                -1+px_x*0.0, -1+px_y*0.0,
                -1+px_x*2.0, -1+px_y*0.0,

                // right
                 1-px_x*0.0,  1-px_y*0.0,
                 1-px_x*2.0,  1-px_y*0.0,

                 1-px_x*0.0, -1+px_y*0.0,
                 1-px_x*2.0, -1+px_y*0.0

            ]),
            attributes: {
                position: {
                    size: 2,
                    stride: 16,
                    offset: 0
                },
                offset: {
                    size: 2,
                    stride: 16,
                    offset: 8
                }
            }
        }),
        velocityFBO0 = new FBO(gl, width, height, gl.FLOAT),
        velocityFBO1 = new FBO(gl, width, height, gl.FLOAT),
        divergenceFBO = new FBO(gl, width, height, gl.FLOAT, singleComponentFboFormat),
        pressureFBO0 = new FBO(gl, width, height, gl.FLOAT, singleComponentFboFormat),
        pressureFBO1 = new FBO(gl, width, height, gl.FLOAT, singleComponentFboFormat),
        advectVelocityKernel = new ComputeKernel(gl, {
            shader: shaders.get('kernel', 'advect'),
            mesh: inside,
            uniforms: {
                px: px,
                px1: px1,
                scale: 1.0,
                velocity: velocityFBO0,
                source: velocityFBO0,
                dt: options.step
            },
            output: velocityFBO1
        }),
        velocityBoundaryKernel = new ComputeKernel(gl, {
            shader: shaders.get('boundary', 'advect'),
            mesh: boundary,
            uniforms: {
                px: px,
                scale: -1.0,
                velocity: velocityFBO0,
                source: velocityFBO0,
                dt: 1/60
            },
            output: velocityFBO1
        }),
        cursor = new Mesh(gl, {
            vertex: geometry.screen_quad(px_x*options.cursor_size*2, px_y*options.cursor_size*2),
            attributes: {
                position: {}
            }
        }),
        addForceKernel = new ComputeKernel(gl, {
            shader: shaders.get('cursor', 'addForce'),
            mesh: cursor,
            blend: 'add',
            uniforms: {
                px: px,
                force: vec2.create([0.5, 0.2]),
                center: vec2.create([0.1, 0.4]),
                scale: vec2.create([options.cursor_size*px_x, options.cursor_size*px_y])
            },
            output: velocityFBO1
        }),
        divergenceKernel = new ComputeKernel(gl, {
            shader: shaders.get('kernel', 'divergence'),
            mesh: all,
            uniforms: {
                velocity: velocityFBO1,
                px: px
            },
            output: divergenceFBO
        }),
        jacobiKernel = new ComputeKernel(gl, {
            shader: shaders.get('kernel', 'jacobi'),
            // use all so the simulation still works
            // even if the pressure boundary is not
            // properly enforced
            mesh: all,
            nounbind: true,
            uniforms: {
                pressure: pressureFBO0,
                divergence: divergenceFBO,
                alpha: -1.0,
                beta: 0.25,
                px: px
            },
            output: pressureFBO1
        }),
        pressureBoundaryKernel = new ComputeKernel(gl, {
            shader: shaders.get('boundary', 'jacobi'),
            mesh: boundary,
            nounbind: true,
            nobind: true,
            uniforms: {
                pressure: pressureFBO0,
                divergence: divergenceFBO,
                alpha: -1.0,
                beta: 0.25,
                px: px
            },
            output: pressureFBO1
        }),

        subtractPressureGradientKernel = new ComputeKernel(gl, {
            shader: shaders.get('kernel', 'subtractPressureGradient'),
            mesh: all,
            uniforms: {
                scale: 1.0,
                pressure: pressureFBO0,
                velocity: velocityFBO1,
                px: px
            },
            output: velocityFBO0
        }),
        subtractPressureGradientBoundaryKernel = new ComputeKernel(gl, {
            shader: shaders.get('boundary', 'subtractPressureGradient'),
            mesh: boundary,
            uniforms: {
                scale: -1.0,
                pressure: pressureFBO0,
                velocity: velocityFBO1,
                px: px
            },
            output: velocityFBO0
        }),


        drawKernel = new ComputeKernel(gl, {
            shader: shaders.get('kernel', 'visualize'),
            mesh: all,
            uniforms: {
                velocity: velocityFBO0,
                pressure: pressureFBO0,
                px: px
            },
            output: null
        });

    var x0 = input.mouse.x,
        y0 = input.mouse.y;

    clock.ontick = function(dt){
        var x1 = input.mouse.x * options.resolution,
            y1 = input.mouse.y * options.resolution,
            xd = x1-x0,
            yd = y1-y0;

        x0 = x1,
        y0 = y1;
        if(x0 === 0 && y0 === 0) xd = yd = 0;
        advectVelocityKernel.uniforms.dt = options.step*1.0;
        advectVelocityKernel.run();


        vec2.set([xd*px_x*options.cursor_size*options.mouse_force,
                 -yd*px_y*options.cursor_size*options.mouse_force], addForceKernel.uniforms.force);
        vec2.set([x0*px_x*2-1.0, (y0*px_y*2-1.0)*-1], addForceKernel.uniforms.center);
        addForceKernel.run();

        velocityBoundaryKernel.run();

        divergenceKernel.run();

        var p0 = pressureFBO0,
            p1 = pressureFBO1,
            p_ = p0;
        for(var i = 0; i < options.iterations; i++) {
            jacobiKernel.uniforms.pressure = pressureBoundaryKernel.uniforms.pressure = p0;
            jacobiKernel.outputFBO = pressureBoundaryKernel.outputFBO = p1;
            jacobiKernel.run();
            pressureBoundaryKernel.run();
            p_ = p0;
            p0 = p1;
            p1 = p_;
        }

        subtractPressureGradientKernel.run();
        subtractPressureGradientBoundaryKernel.run();

        drawKernel.run();

    };
}

if(gl)
loader.load([
            'shaders/advect.frag',
            'shaders/addForce.frag',
            'shaders/divergence.frag',
            'shaders/jacobi.frag',
            'shaders/subtractPressureGradient.frag',
            'shaders/visualize.frag',
            'shaders/cursor.vertex',
            'shaders/boundary.vertex',
            'shaders/kernel.vertex'
], init); 

});
