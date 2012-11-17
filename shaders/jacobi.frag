precision highp float;
uniform sampler2D pressure;
uniform sampler2D divergence;
uniform float alpha;
uniform float beta;
uniform vec2 px;
varying vec2 uv;

void main(){
    float x0 = texture2D(pressure, uv-vec2(px.x, 0)).x;
    float x1 = texture2D(pressure, uv+vec2(px.x, 0)).x;
    float y0 = texture2D(pressure, uv-vec2(0, px.y)).x;
    float y1 = texture2D(pressure, uv+vec2(0, px.y)).x;
    float d = texture2D(divergence, uv).x;
    float relaxed = (x0 + x1 + y0 + y1 + alpha * d) * beta;
    gl_FragColor = vec4(relaxed);
}
