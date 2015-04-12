precision mediump float;

// our texture
uniform sampler2D u_imagedrawing;
uniform sampler2D u_imageuv;
uniform sampler2D u_imagewebgl;

// size of the current texture
uniform vec2 u_textureSize;

// the texCoords passed in from the vertex shader.
varying vec2 v_texCoord;

void main() {

  // compute 1 pixel in texture coordinates.
  vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;

  // drawing
  float PI = 3.1415926535897932384626433;

  // get drawing color
  vec4 colordrawing = texture2D(u_imagedrawing, v_texCoord);

  // get uv velocity
  vec4 coloruv = texture2D(u_imageuv, v_texCoord);
  // convert from colors in range 0-1 to pixel velocity
  vec2 uv = vec2((coloruv[0] - 0.5)/0.5 , (coloruv[1] - 0.5)/0.5) ;

  vec4 colorold = texture2D(u_imagewebgl, v_texCoord);

  // get advected color from previous texture
  vec4 colornew = texture2D(u_imagewebgl, v_texCoord  - uv) ;
  // vec4 colornew = texture2D(u_imagewebgl, v_texCoord  - vec2(0.0001, 0.0)) ;

  // gl_FragColor = colordrawing + colornew;
  // gl_FragColor = texture2D(u_imageuv, v_texCoord) ;
  // gl_FragColor = vec4(v_texCoord[0], v_texCoord[1], 0.0, 1.0);
  gl_FragColor = coloruv;

}
