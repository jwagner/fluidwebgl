define(function(require, exports, module){
    
var scene = exports,
    mesh = require('gl/mesh'),
    glUtils = require('gl/utils'),
    vec3 = require('gl-matrix').vec3,
    vec4 = require('gl-matrix').vec4,
    mat3 = require('gl-matrix').mat3,
    mat4 = require('gl-matrix').mat4,
    extend = require('utils').extend;

scene.Node = function SceneNode(children){
    this.children = children || [];
};
scene.Node.prototype = {
    debug: false,
    children: [],
    visit: function(graph) {
        //if(this.debug) debugger;
        this.enter(graph);
        for(var i = 0; i < this.children.length; i++) {
            var child = this.children[i];
            child.visit(graph);
        }
        this.exit(graph);
    },
    append: function (child) {
        this.children.push(child);
    },
    enter: function(graph) {
    },
    exit: function(graph) {
    }
};

scene.Uniforms = function UniformsNode(uniforms, children) {
    this.uniforms = uniforms;
    this.children = children;
};
scene.Uniforms.prototype = extend({}, scene.Node.prototype, {
    enter: function(graph) {
        for(var uniform in this.uniforms){
            var value = this.uniforms[uniform];
            if(value.bindTexture){
                value.bindTexture(graph.pushTexture());
            }
        }
        graph.pushUniforms();
        extend(graph.uniforms, this.uniforms);
    },
    exit: function(graph) {
        for(var uniform in this.uniforms){
            var value = this.uniforms[uniform];
            if(value.bindTexture){
                value.unbindTexture();
                graph.popTexture();
            }
        }
        graph.popUniforms();
    }
});

scene.Graph = function SceneGraph(gl){
    this.root = new scene.Node();
    this.uniforms = Object.create(null);
    this.shaders = [];
    this.viewportWidth = 640;
    this.viewportHeight = 480;
    this.textureUnit = 0;
    this.statistics = {
        drawCalls: 0,
        vertices: 0
    };
};
scene.Graph.prototype = {
    draw: function() {

        this.statistics.drawCalls = 0;
        this.statistics.vertices = 0;

        gl.viewport(0, 0, this.viewportWidth, this.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // only clearing DEPTH is supposedly faster
        //gl.clear(gl.DEPTH_BUFFER_BIT);
        //gl.enable(gl.DEPTH_TEST);
        this.root.visit(this);
    },
    pushUniforms: function() {
        this.uniforms = Object.create(this.uniforms);
    },
    popUniforms: function() {
        this.uniforms = Object.getPrototypeOf(this.uniforms);
    },
    pushTexture: function () {
        return this.textureUnit++;
    },
    popTexture: function() {
        this.textureUnit--;
    },
    pushShader: function (shader) {
        this.shaders.push(shader);
    },
    popShader: function() {
        this.shaders.pop();
    },
    getShader: function () {
        return this.shaders[this.shaders.length-1];
    }
};

scene.Material = function Material(shader, uniforms, children) {
    this.shader = shader;
    this.uniforms = uniforms;
    this.children = children;
};
scene.Material.prototype = extend({}, scene.Node.prototype, {
    enter: function(graph){
        graph.pushShader(this.shader);
        this.shader.use();
        scene.Uniforms.prototype.enter.call(this, graph);
    },
    exit: function(graph) {
        scene.Uniforms.prototype.exit.call(this, graph);
        graph.popShader();
    }
});

scene.RenderTarget = function RenderTarget(fbo, children){
    this.fbo = fbo;
    this.children = children;
};
scene.RenderTarget.prototype = extend({}, scene.Node.prototype, {
    enter: function(graph) {
        this.fbo.bind();
        gl.viewport(0, 0, this.fbo.width, this.fbo.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    },
    exit: function(graph) {
        // needed?
        this.fbo.unbind();
        gl.viewport(0, 0, graph.viewportWidth, graph.viewportHeight);
    }
});

scene.Camera = function Camera(children){
    this.position = vec3.create([0, 0, 10]);
    this.pitch = 0.0;
    this.yaw = 0.0;
    this.near = 0.1;
    this.far = 5000;
    this.fov = 50;

    this.children = children;
};
scene.Camera.prototype = extend({}, scene.Node.prototype, {
    enter: function (graph) {
        var projection = this.getProjection(graph),
            worldView = this.getWorldView(),
            wvp = mat4.create();

        graph.pushUniforms();
        mat4.multiply(projection, worldView, wvp);
        graph.uniforms.worldViewProjection = wvp;
        graph.uniforms.worldView = worldView;
        graph.uniforms.projection = projection;
        graph.uniforms.eye = this.position;
        //this.project([0, 0, 0, 1], scene);
    },
    project: function(point, graph) {
        var mvp = mat4.create();
        mat4.multiply(this.getProjection(graph), this.getWorldView(), mvp);
        var projected = mat4.multiplyVec4(mvp, point, vec4.create());
        vec4.scale(projected, 1/projected[3]);
        return projected;
    },
    exit: function(graph) {
        graph.popUniforms();
    },
    getRay: function() {
        var invRot = this.getInverseRotation(),
            forward = vec3.create([0, 0, -1]);
        mat4.multiplyVec3(invRot, forward);
        vec3.normalize(forward);
        return new Float32Array([this.position[0], this.position[1], this.position[2], forward[0], forward[1], forward[2]]);
    }, 
    getInverseRotation: function () {
        return mat3.toMat4(mat4.toInverseMat3(this.getWorldView()));
    },
    getRottionOnly: function () {
        return mat3.toMat4(mat4.toInverseMat3(this.getWorldView()));
    },
    getProjection: function (graph) {
        return mat4.perspective(this.fov, graph.viewportWidth/graph.viewportHeight, this.near, this.far);
    },
    getWorldView: function(){
        var matrix = mat4.identity(mat4.create());
        mat4.rotateX(matrix, this.pitch);
        mat4.rotateY(matrix, this.yaw);
        mat4.translate(matrix, vec3.negate(this.position, vec3.create()));
        return matrix;
    }
});



scene.Skybox = function SkyboxNode(scale, shader, uniforms) {
    var mesh_ = new scene.SimpleMesh(new glUtils.VBO(mesh.cube(scale))),
        material = new scene.Material(shader, uniforms, [mesh_]);
    this.children = [material];
};
scene.Skybox.prototype = extend({}, scene.Node.prototype, {
    enter: function(graph){
        graph.pushUniforms();
        var worldViewProjection = mat4.create(),
            worldView = mat3.toMat4(mat4.toMat3(graph.uniforms.worldView));
        //mat4.identity(worldView);
        mat4.multiply(graph.uniforms.projection, worldView, worldViewProjection);
        graph.uniforms.worldViewProjection = worldViewProjection;
    },
    exit: function(graph){
        graph.popUniforms();
    }
});

scene.Postprocess = function PostprocessNode(shader, uniforms) {
    var mesh_ = new scene.SimpleMesh(new glUtils.VBO(mesh.screen_quad())),
        material = new scene.Material(shader, uniforms, [mesh_]);
    this.children = [material];
};
scene.Postprocess.prototype = scene.Node.prototype;

scene.Transform = function Transform(children){
    this.children = children || [];
    this.matrix = mat4.create();
    mat4.identity(this.matrix);
    this.aux = mat4.create();
};
scene.Transform.prototype = extend({}, scene.Node, {
    enter: function(graph) {
        graph.pushUniforms();
        if(graph.uniforms.modelTransform){
            mat4.multiply(graph.uniforms.modelTransform, this.matrix, this.aux);
            graph.uniforms.modelTransform = this.aux;
        }
        else{
            graph.uniforms.modelTransform = this.matrix;
        }
    },
    exit: function(graph) {
        graph.popUniforms();
    }
});

function sign(x){
    return x >= 0 ? 1 : -1;
}


scene.Mirror = function MirrorNode(plane, children){
    scene.Node.call(this, children);
    var a = plane[0],
        b = plane[1],
        c = plane[2];
    this._plane = vec4.create([plane[0], plane[1], plane[2], 0]);
    this._viewPlane = vec4.create();
    this._q = vec4.create();
    this._c = vec4.create();
    this._projection = mat4.create();
    this._worldView = mat4.create([
        1.0-(2*a*a), 0.0-(2*a*b), 0.0-(2*a*c), 0.0,
        0.0-(2*a*b), 1.0-(2*b*b), 0.0-(2*b*c), 0.0,
        0.0-(2*a*c), 0.0-(2*b*c), 1.0-(2*c*c), 0.0,
        0.0, 0.0, 0.0, 1.0
    ]);
    //mat4.identity(this._worldView);
    this._worldView_ = mat4.create();
    this._worldViewProjection = mat4.create();
};
scene.Mirror.prototype = extend({}, scene.Node.prototype, {
    enter: function (graph) {
        graph.pushUniforms();
        gl.cullFace(gl.FRONT);
        //

        var worldView = graph.uniforms.worldView,
            projection = mat4.set(graph.uniforms.projection, this._projection),
            p = this._viewPlane,
            q = this._q,
            c = this._c,
            // TODO calculate proper distance
            w = -graph.uniforms.eye[1];

        mat4.multiplyVec4(worldView, this._plane, p);
        p[3] = w;
        graph.uniforms.worldView = mat4.multiply(graph.uniforms.worldView, this._worldView, this._worldView_);

        q[0] = (sign(p.x) + projection[8]) / projection[0];
        q[1] = (sign(p.y) + projection[9]) / projection[5];
        q[2] = -1;
        q[3] = (1.0+projection[10] ) / projection[14];

        // scaled plane
        var dotpq = p[0]*q[0] + p[1]*q[1] + p[2]*q[2] + p[3]*q[3];
        c = vec4.scale(p, 2.0/dotpq);

        projection[2] = c[0];
        projection[6] = c[1];
        projection[10] = c[2] + 1.0;
        projection[14] = c[3];

        graph.uniforms.worldViewProjection = mat4.multiply(projection, this._worldView_, this._worldViewProjection);
        graph.uniforms.projection = projection;
        
    },
    exit: function (graph) {
        graph.popUniforms();
        gl.cullFace(gl.BACK);
    }
});



scene.SimpleMesh = function SimpleMesh(vbo, mode){
    this.vbo = vbo;
    this.mode = mode || gl.TRIANGLES;
};
scene.SimpleMesh.prototype = {
    visit: function (graph) {
        var shader = graph.getShader(),
            location = shader.getAttribLocation('position'),
            stride = 0,
            offset = 0,
            normalized = false;

        this.vbo.bind();

        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, 3, gl.FLOAT, normalized, stride, offset);

        shader.uniforms(graph.uniforms);

        graph.statistics.drawCalls ++;
        graph.statistics.vertices += this.vbo.length/3;

        this.draw();

        this.vbo.unbind();
    },
    draw: function(){
        this.vbo.draw(this.mode);
    }
};

});
