precision mediump float;

// our texture
uniform sampler2D u_image;

// our textures
uniform sampler2D u_image0;
uniform sampler2D u_image1;

// the texCoords passed in from the vertex shader.
varying vec2 v_texCoord;

void main() {
  vec4 color0 = texture2D(u_image0, v_texCoord);
  vec4 color1 = texture2D(u_image1, v_texCoord - vec2(0.0011, v_texCoord[0]/100.0)) ;
  gl_FragColor = max(color0, color1);

}
