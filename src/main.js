define(function(require, exports, module){
require('game-shim');

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
    vec2 = glm.vec2;

var ITERATIONS = 32,
    MOUSE_FORCE = 10,
    CURSOR_SIZE = 1000,
    STEP = 1/60;

var canvas = document.getElementById('c'),
    gl = glcontext.initialize(canvas, {
        context: {
            depth: false
        },
        //debug: false,
        //log_all: true,
        extensions: {
            texture_float: true
        }
    }, function(el, msg, id) { alert(msg); }),
    clock = new Clock(canvas),
    input = new InputHandler(canvas);

window.gl = gl;

var loader = new Loader(),
    resources = loader.resources,
    shaders = new ShaderManager(gl, resources);
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

function init(){
    var onresize;
    window.addEventListener('resize', debounce(onresize = function(){
        var rect = canvas.getBoundingClientRect();
        console.log(rect.width, rect.height);
        if(rect.width != canvas.width || rect.height != canvas.height){
            input.updateOffset();
            setup(rect.width, rect.height);
        }
    }, 250));
    onresize();
    clock.start();
}

function ComputeKernel(gl, options){
    this.gl = gl;
    this.shader = options.shader;
    this.mesh = options.mesh;
    this.uniforms = options.uniforms;
    this.outputFBO = options.output;
    this.blend = options.blend;
    this.nobind = options.nobind;
    this.nounbind = options.nounbind;
}
ComputeKernel.prototype.run = function(){
    if(this.outputFBO && !this.nobind) {
        this.outputFBO.bind();
    }
    var textureUnit = 0, value;
    for(var name in this.uniforms){
        if(this.uniforms.hasOwnProperty(name)){
            value = this.uniforms[name];
            if(value.bindTexture && !value.bound){
                value.bindTexture(textureUnit++);
            }
        }
    }
    this.shader.use();
    this.shader.uniforms(this.uniforms);
    if(this.blend === 'add'){
        this.gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        this.gl.enable(gl.BLEND);
    }
    else {
        this.gl.disable(gl.BLEND);
    }
    this.mesh.draw(this.shader);
    if(this.outputFBO && !this.nounbind) {
        this.outputFBO.unbind();
    }
    for(name in this.uniforms){
        if(this.uniforms.hasOwnProperty(name)){
            value = this.uniforms[name];
            if(value.bindTexture && value.bound){
                value.unbindTexture();
            }
        }
    }
};

function setup(width, height){
    canvas.width = width,
    canvas.height = height;

    gl.viewport(0, 0, width, height);
    gl.lineWidth(1.0);

    var px_x = 1.0/canvas.width,
        px_y = 1.0/canvas.height,
        px = vec2.create([px_x, px_y]);
        px1 = vec2.create([1, canvas.width/canvas.height]);
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
        });
        velocityFBO0 = new FBO(gl, width, height, gl.FLOAT),
        velocityFBO1 = new FBO(gl, width, height, gl.FLOAT),
        divergenceFBO = new FBO(gl, width, height, gl.FLOAT, gl.LUMINANCE),
        pressureFBO0 = new FBO(gl, width, height, gl.FLOAT, gl.LUMINANCE),
        pressureFBO1 = new FBO(gl, width, height, gl.FLOAT, gl.LUMINANCE),
        advectVelocityKernel = new ComputeKernel(gl, {
            shader: shaders.get('kernel', 'advect'),
            mesh: inside,
            uniforms: {
                px: px,
                px1: px1,
                scale: 1.0,
                velocity: velocityFBO0,
                source: velocityFBO0,
                dt: STEP
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
            vertex: geometry.screen_quad(px_x*CURSOR_SIZE*2, px_y*CURSOR_SIZE*2),
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
                scale: vec2.create([CURSOR_SIZE*px_x, CURSOR_SIZE*px_y])
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
    //advectFBO.bind();
    //m.draw(advectShader);
    //advectFBO.unbind();

    //visualizeShader.use();
    //advectFBO.bindTexture(0);
    //visualizeShader.uniforms({source: advectFBO});
    //m.draw(visualizeShader);
    var x0 = input.mouse.x,
        y0 = input.mouse.y;
    clock.ontick = function(dt){
        var x1 = input.mouse.x,
            y1 = input.mouse.y,
            xd = x1-x0,
            yd = y1-y0;
        x0 = x1,
        y0 = y1;
        if(x0 === 0 && y0 === 0) xd = yd = 0;
        //advectVelocityKernel.outputFBO = velocityFBO1;
        //advectVelocityKernel.uniforms.velocity = velocityFBO0;
        //advectVelocityKernel.uniforms.source = velocityFBO0;
        advectVelocityKernel.run();


        vec2.set([xd*px_x*CURSOR_SIZE*MOUSE_FORCE, -yd*px_y*CURSOR_SIZE*MOUSE_FORCE], addForceKernel.uniforms.force);
        vec2.set([x0*px_x*2-1.0, (y0*px_y*2-1.0)*-1], addForceKernel.uniforms.center);
        addForceKernel.run();

        velocityBoundaryKernel.run();

        //advectVelocityKernel.outputFBO = velocityFBO0;
        //advectVelocityKernel.uniforms.velocity = velocityFBO1;
        //advectVelocityKernel.uniforms.source = velocityFBO1;
        //advectVelocityKernel.run();

        divergenceKernel.run();

        var p0 = pressureFBO0,
            p1 = pressureFBO1,
            p_ = p0;
        for(var i = 0; i < ITERATIONS; i++) {
            jacobiKernel.uniforms.pressure = pressureBoundaryKernel.uniforms.pressure = p0;
            jacobiKernel.outputFBO = pressureBoundaryKernel.uniforms.outputFBO = p1;
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

});
