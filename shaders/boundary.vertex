attribute vec3 position;
attribute vec3 offset;
varying vec2 uv;

precision highp float;

void main(){
    uv = offset.xy*0.5+0.5;
    gl_Position = vec4(position, 1.0);
}
