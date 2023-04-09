const fragmentShader = /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 eyeVector;

    uniform float uTime;
    uniform sampler2D uTexture;

    vec2 hash22(vec2 p) {
        p = fract(p * vec2(5.3983, 5.4427));
        p += dot(p.xy, p.xy + vec2(21.5351, 14.3137));
        return fract(vec2(p.x * p.y * 95.4337, p.x * p.y * 97.597));
    }

    void main() {
        
        vec3 X = dFdx(vNormal);
        vec3 Y = dFdy(vNormal);
        vec3 normal = normalize(cross(X,Y));
        
        float diffuse = dot(normal, vec3(1.));
        vec2 random = hash22(vec2(floor(diffuse * 15.))); // Blink speed

        vec2 newCoord = vec2(sign(random.x - 0.5) * 1. + random.x * 0.6, sign(random.y - 0.5) * 1. + random.y * 0.6); // Gets random coords of the image
        
        float fresnel = pow(1. + dot(eyeVector, normal), 3.);

        vec2 newUV = newCoord * gl_FragCoord.xy / vec2(1000.); // gl_FragCoord = viewport coordinates

        vec3 refracted = refract(eyeVector, normal, 1. / 3.);
        newUV += 0.2 * refracted.xy;
        
        vec4 texture = texture2D(uTexture, newUV);

        gl_FragColor = texture * (1. - fresnel);
        // gl_FragColor = vec4(vec3(diffuse), 1.);
        // gl_FragColor = vec4(vec3(fresnel), 1.);
    }
`;

export default fragmentShader;
