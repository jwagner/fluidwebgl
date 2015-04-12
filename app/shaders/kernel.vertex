attribute vec3 position;
uniform vec2 px;
varying vec2 uv;

precision highp float;

void main(){
    uv = vec2(0.5)+(position.xy)*0.5;
    gl_Position = vec4(position, 1.0);
}
