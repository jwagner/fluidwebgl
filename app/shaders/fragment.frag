// fragment shader
precision mediump float;

// the texCoords passed in from the vertex shader.
varying vec2 v_texCoord;

void main() {
  gl_FragColor = vec4(v_texCoord[0]/100.0,
                      v_texCoord[1]/100.0,
                      1,
                      (v_texCoord[0] + v_texCoord[1])/40.0 );
}
