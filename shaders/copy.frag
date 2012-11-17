precision highp float;
uniform sampler2D source;
varying vec2 uv;

void main(){
    gl_FragColor = texture2D(source, uv);
}
