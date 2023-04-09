const fragmentShader = /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 eyeVector;
    varying vec3 vBary;

    uniform float uTime;
    uniform sampler2D uTexture;

    vec2 hash22(vec2 p) {
        p = fract(p * vec2(5.3983, 5.4427));
        p += dot(p.xy, p.xy + vec2(21.5351, 14.3137));
        return fract(vec2(p.x * p.y * 95.4337, p.x * p.y * 97.597));
    }

    void main() {
        float width = 2.; // Lines width
        vec3 rateOfChange = fwidth(vBary);
        vec3 drawLines = smoothstep(rateOfChange * (width + 0.5), rateOfChange * (width - 0.5), vBary); // Separate the lines from the faces

        float lineColor = max(drawLines.x, max(drawLines.y, drawLines.z)); // Sets all lines to a color
        if (lineColor < 0.1) discard; // Removes the faces

        gl_FragColor = vec4(mix(vec3(0.), vec3(1.), lineColor), 1.);
    }
`;

export default fragmentShader;
