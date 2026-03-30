uniform vec3 uPrimary;
uniform vec3 uSecondary;
uniform vec3 uAccent;

uniform float uOpacity;
uniform float uTime;
uniform float uProgress;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;

  // 🌊 soft distortion (liquid feel)
  uv.x += sin(uv.y * 8.0 + uTime * 0.8) * 0.015;
  uv.y += sin(uv.x * 5.0 + uTime * 0.5) * 0.01;

  float y = uv.y;

  // 🎯 3-color gradient (like your background)
  vec3 color;

  if (y < 0.5) {
    // bottom → middle (blue → purple)
    float t = smoothstep(0.0, 0.5, y);
    color = mix(uPrimary, uSecondary, t);
  } else {
    // middle → top (purple → pink)
    float t = smoothstep(0.5, 1.0, y);
    color = mix(uSecondary, uAccent, t);
  }

  // ✨ keep it soft / airy (VERY IMPORTANT)
  color = mix(color, vec3(1.0), 0.5);

  // ✨ subtle animated gradient movement
  float shift = sin(uTime * 0.6 + uv.x * 4.0) * 0.05;
  color = mix(color, vec3(1.0), shift * 0.2);

  // 🫧 soft top fade (foam feel)
  float edgeFade = smoothstep(1.0, 0.85, uv.y);

  float alpha = uOpacity * edgeFade;

  // ✨ more transparent when filled
  alpha *= mix(1.0, 0.6, uProgress);

  gl_FragColor = vec4(color, alpha);
}