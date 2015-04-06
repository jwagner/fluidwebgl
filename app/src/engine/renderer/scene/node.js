define(function(require, exports, module){

function noop(){}
function compileChild(c){
    return c.compile();
}
    
exports.Node = function(parent) {
    this.uniforms = Object.create(null);
    this.root = this;    //this.parent = parent;
    this.children = [];
};
exports.Node.prototype = {
    visit: function() {
        //if(this.debug) debugger;
        this.enter();
        for(var i = 0; i < this.children.length; i++) {
            this.children[i].visit();
        }
        this.exit();
    },
    enter: function() {
    },
    exit: function() {
    },
    updateWorldTransform: function() {
        for(var i = 0; i < this.children.length; i++) {
            this.children[i].updateWorldTransform();
        }
    },
    updateUniforms: function() {
        this.uniforms = this.parent.uniforms;
        for(var i = 0; i < this.children.length; i++) {
            this.children[i].updateUniforms();
        }
    },

    append: function (child) {
        this.children.push(child);
        child.setParent(this);
        return this;
    },
    setParent: function(parent) {
        this.root = parent.root;
        this.parent = parent;
        this.updateUniforms();
    }

};

});
