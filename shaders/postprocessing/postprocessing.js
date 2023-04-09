const PostProcessing = {
  uniforms: {
    uTime: { value: 0 },
    tDiffuse: { value: null },
    resolution: { value: null },
    pixelSize: { value: 1 },
    uShift: { value: 0.3 },
  },
  vertexShader: /* glsl */ `
      varying highp vec2 vUv;

      void main() {
          vUv = uv;

          vec4 mvPosition = modelViewMatrix * vec4( position, 1. );
          gl_Position = projectionMatrix * mvPosition;
      }
      `,
  fragmentShader: /* glsl */ `
    uniform float uTime;
    uniform sampler2D tDiffuse;
    uniform float pixelSize;
    uniform vec2 resolution;
    uniform float uShift;

    varying highp vec2 vUv;

    float hash(vec2 p) { return fract(1e4 * sin(17.0 * p.x + p.y * 0.1) * (0.1 + abs(sin(p.y * 13.0 + p.x)))); }

    void main() {
        vec2 shift = vec2(0.01, 0.01) * uShift; 

        // Make b/w
        vec4 texture2 = texture2D(tDiffuse, vUv - shift);
        vec4 texture1 = texture2D(tDiffuse, vUv + shift);
        vec4 texture = texture2D(tDiffuse, vUv);
        vec3 color = vec3((texture.r, texture.g, texture.b) / 3.); // Change for opacity
        vec3 color1 = vec3((texture1.r, texture1.g, texture1.b) / 3.); // Change for opacity
        vec3 color2 = vec3((texture2.r, texture2.g, texture2.b) / 3.); // Change for opacity

        // RGB Shift
        color = vec3(color1.r, color.g, color2.b);

        // Noise
        float value = hash(vUv + uTime) * 0.3;

        vec2 dxy = pixelSize / resolution;
        vec2 coord = dxy * floor(vUv / dxy);
        // gl_FragColor = texture2D(tDiffuse, vUv);
        gl_FragColor = vec4(vec3(color + vec3(value)), 1.);
    }
    `,
};

export default PostProcessing;
