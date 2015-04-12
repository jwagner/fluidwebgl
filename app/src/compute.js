define(function(require, exports, module){

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

exports.Kernel = ComputeKernel;


});
