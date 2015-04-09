precision mediump float;

// our texture
uniform sampler2D u_image;

// our textures
uniform sampler2D u_image0;
uniform sampler2D u_image1;


// the texCoords passed in from the vertex shader.
varying vec2 v_texCoord;

void main() {
  // drawing
  float PI = 3.1415926535897932384626433;
  vec4 color0 = texture2D(u_image0, v_texCoord);
  // webgl canvas
  vec4 color1 = texture2D(u_image1, v_texCoord + vec2(0.0011, v_texCoord[0]/200.0)) ;
  gl_FragColor = color0 + color1;

}
