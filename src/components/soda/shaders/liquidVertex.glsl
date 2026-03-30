uniform float uTime;
uniform float uWaveAmplitude;
uniform float uWaveFrequency;

varying vec2 vUv;

void main() {
  vUv = uv;

  vec3 pos = position;

  // Multi-layered sine wave distortion for fizzy/chaotic liquid surface
  float wave1 = sin(pos.x * uWaveFrequency + uTime * 2.5) * uWaveAmplitude;
  float wave2 = sin(pos.x * uWaveFrequency * 1.8 - uTime * 2.0) * uWaveAmplitude * 0.6;
  float wave3 = cos(pos.x * uWaveFrequency * 0.5 + uTime * 3.5) * uWaveAmplitude * 0.4;

  // Add a bit of Z-axis wave for genuine 3D displacement
  float depthWave = sin(pos.y * 5.0 + uTime * 3.0) * 0.1;

  pos.y += wave1 + wave2 + wave3 + depthWave;
  pos.z += wave1 * 0.5;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
