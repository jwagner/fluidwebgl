precision highp float;

uniform vec2 force;
uniform vec2 center;
uniform vec2 scale;
uniform vec2 px;
varying vec2 uv;

void main(){
    float distance_ = 1.0-min(length((uv-center)/scale), 1.0);
    /*vec2 force = velocity*distance_;*/
    gl_FragColor = vec4(force*distance_, 0, 1);
    /*gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);*/
}
