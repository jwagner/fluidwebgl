define(function(require, exports, module){

var cameracontroller = exports,
    clamp = require('utils').clamp;



cameracontroller.MouseController = function MouseController(input, camera) {
    this.input = input;
    this.camera = camera;
    this.velocity = 1.0;
};
cameracontroller.MouseController.prototype = {
    tick: function(td) {
        if(this.camera == null) return;
        if(this.input.mouse.down){
            var x = this.input.mouse.x - this.input.element.width*0.5,
                y = this.input.mouse.y - this.input.element.height*0.5;
            this.camera.yaw += 0.001*x*td;
            this.camera.pitch += 0.001*y*td;
        }

        var inverseRotation = this.camera.getInverseRotation(),
            direction = vec3.create();

        if(this.input.keys.W || this.input.keys.UP){
            direction[2] = -1;
        }
        else if(this.input.keys.S || this.input.keys.DOWN){
            direction[2] = 1;
        }
        if(this.input.keys.A || this.input.keys.LEFT){
            direction[0] = -1;
        }
        else if(this.input.keys.D || this.input.keys.RIGHT){
            direction[0] = 1;
        }
        vec3.scale(vec3.normalize(direction), td*this.velocity);
        mat4.multiplyVec3(inverseRotation, direction);
        vec3.add(this.camera.position, direction);
    }
};

});
