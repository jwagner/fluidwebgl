precision mediump float;

// our textures
// drawing from previous timestep
uniform sampler2D u_imagewebgl;
// current drawing
uniform sampler2D u_imagedrawing;
// velocities
uniform sampler2D u_imageuv;

// the texCoords passed in from the vertex shader, in 0,1.
varying vec2 v_texCoord;

void main() {

  // get color from drawing
  vec4 colordrawing = texture2D(u_imagedrawing, v_texCoord);

  // old color at current location
  vec4 colorold = gl_FragColor;

  // get uv velocity
  vec4 coloruv = texture2D(u_imageuv, v_texCoord);

  // uv in pixels/frame
  vec2 uv = vec2((coloruv[0] - 0.5)/0.5 , (coloruv[1] - 0.5)/0.5) ;

  // get advected color from previous texture
  vec4 colornew = texture2D(u_imagewebgl, v_texCoord - uv/100.0) ;
  //vec4 colornew = texture2D(u_imagewebgl, v_texCoord) ;

  vec4 textureCoordinate = vec4(v_texCoord[0], v_texCoord[1], 0.0, 1.0);

  gl_FragColor = vec4(min(colornew.rgb, colordrawing.rgb), max(colornew[3], colordrawing[3]));

}
