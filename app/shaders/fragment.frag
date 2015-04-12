precision mediump float;

// our texture
uniform sampler2D u_imagedrawing;
uniform sampler2D u_imageuv;
uniform sampler2D u_imagewebgl;


// the texCoords passed in from the vertex shader.
varying vec2 v_texCoord;

void main() {
  // drawing
  float PI = 3.1415926535897932384626433;

  // get drawing color
  vec4 colordrawing = texture2D(u_imagedrawing, v_texCoord);

  // get uv velocity
  vec4 coloruv = texture2D(u_imageuv, v_texCoord);
  vec2 uv = vec2(coloruv[0] - 0.5 , coloruv[1] - 0.5);

  vec4 colorold = texture2D(u_imagewebgl, v_texCoord);

  // get advected color from previous texture
  vec4 colornew = texture2D(u_imagewebgl, v_texCoord - uv ) ;

  // gl_FragColor = colordrawing + colornew;
  // gl_FragColor = texture2D(u_imageuv, v_texCoord) ;
  gl_FragColor = coloruv;

}
