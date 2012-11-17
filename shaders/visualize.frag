precision highp float;
uniform sampler2D velocity;
uniform sampler2D pressure;
varying vec2 uv;

void main(){
    gl_FragColor = vec4(
        (texture2D(pressure, uv)).x,
        (texture2D(velocity, uv)*1.5+0.5).xy,
    1.0);
}
