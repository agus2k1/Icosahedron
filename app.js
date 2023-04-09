import './main.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import PostProcessing from './shaders/postprocessing/postprocessing.js';
import fragment from './shaders/fragment.glsl.js';
import linesFragment from './shaders/lines/linesFragment.glsl';
import vertex from './shaders/vertex.glsl.js';
import image from './images/ico-texture.png';

export default class Sketch {
  constructor() {
    this.scene = new THREE.Scene();
    this.container = document.getElementById('container');
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x000b1c, 1);
    this.renderer.useLegacyLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.001,
      1000
    );
    this.camera.position.set(0, 0, 2);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.time = 0;
    this.mouse = 0;

    this.mouseEvent();
    this.addMesh();
    this.addPost();
    // this.setupResize();
    // this.resize();
    this.render();
  }

  setupResize() {
    window.addEventListener('resize', this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.composer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;

    // image cover
    this.imageAspect = 853 / 1280;
    let a1;
    let a2;
    if (this.height / this.width > this.imageAspect) {
      a1 = (this.width / this.height) * this.imageAspect;
      a2 = 1;
    } else {
      a1 = 1;
      a2 = this.height / this.width / this.imageAspect;
    }

    this.material.uniforms.resolution.value.x = this.width;
    this.material.uniforms.resolution.value.y = this.height;
    this.material.uniforms.resolution.value.z = a1;
    this.material.uniforms.resolution.value.w = a2;

    // PostProcessing.uniforms.resolution.value.x = this.width;
    // PostProcessing.uniforms.resolution.value.y = this.height;
    // PostProcessing.uniforms.resolution.value.z = a1;
    // PostProcessing.uniforms.resolution.value.w = a2;

    // optional - cover with quad
    const distance = this.camera.position.z;
    const height = 1;
    this.camera.fov = 2 * (180 / Math.PI) * Math.atan(height / (2 * distance));

    // if (w/h > 1)
    if (this.width / this.height > 1) {
      this.icosahedron.scale.x = this.camera.aspect;
    } else {
      this.icosahedron.scale.y = 1 / this.camera.aspect;
    }

    this.camera.updateProjectionMatrix();
  }

  mouseEvent() {
    this.lastX = 0;
    this.lastY = 0;
    this.speed = 0;
    document.addEventListener('mousemove', (e) => {
      this.speed =
        Math.sqrt((e.pageX - this.lastX) ** 2 + (e.pageY - this.lastY) ** 2) *
        0.1;
      this.lastX = e.pageX;
      this.lastY = e.pageY;
    });
  }

  addPost() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    this.customPass = new ShaderPass(PostProcessing);
    this.customPass.uniforms['resolution'].value = new THREE.Vector2(
      window.innerWidth,
      window.innerHeight
    );
    this.customPass.uniforms['resolution'].value.multiplyScalar(
      window.devicePixelRatio
    );

    this.composer.addPass(this.customPass);
  }

  addMesh() {
    let texture = new THREE.TextureLoader().load(image);
    texture.wrapS = texture.wrapT = THREE.MirroredRepeatWrapping;

    // Icosahedron material
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: '#extension GL_OES_standard_derivatives : enable',
      },
      uniforms: {
        uTime: { value: 0 },
        resolution: { value: new THREE.Vector4() },
        uTexture: { value: texture },
        uMouse: { value: 0 },
      },
      fragmentShader: fragment,
      vertexShader: vertex,
      side: THREE.DoubleSide,
      // wireframe: true,
    });

    // Lines material
    this.linesMaterial = new THREE.ShaderMaterial({
      extensions: {
        derivatives: '#extension GL_OES_standard_derivatives : enable',
      },
      uniforms: {
        uTime: { value: 0 },
        resolution: { value: new THREE.Vector4() },
        uTexture: { value: texture },
        uMouse: { value: 0 },
      },
      fragmentShader: linesFragment,
      vertexShader: vertex,
      side: THREE.DoubleSide,
      // wireframe: true,
    });

    // Icosahedron
    this.geometry = new THREE.IcosahedronGeometry(1, 1);

    // Lines on the edges of the icosahedron
    this.linesGeometry = new THREE.IcosahedronGeometry(1.001, 1);

    let length = this.linesGeometry.attributes.position.array.length;

    let bary = [];

    for (let i = 0; i < length / 3; i++) {
      bary.push(0, 0, 1, 0, 1, 0, 1, 0, 0);
    }

    let aBary = new Float32Array(bary);

    this.linesGeometry.setAttribute(
      'aBary',
      new THREE.BufferAttribute(aBary, 3)
    );

    // Adding to the scene
    this.icosahedron = new THREE.Mesh(this.geometry, this.material);
    this.lines = new THREE.Mesh(this.linesGeometry, this.linesMaterial);
    this.scene.add(this.icosahedron);
    this.scene.add(this.lines);
  }

  render() {
    this.time += 0.05;
    this.mouse -= (this.mouse - this.speed) * 0.05;
    this.scene.rotation.set((2 * this.time) / 100, (2 * this.time) / 100, 0);
    this.material.uniforms.uTime.value = this.time;
    this.material.uniforms.uMouse.value = this.mouse;
    this.linesMaterial.uniforms.uTime.value = this.time;
    this.linesMaterial.uniforms.uMouse.value = this.mouse;
    this.customPass.uniforms.uTime.value = this.time;
    this.customPass.uniforms.uShift.value = this.mouse / 10;
    // this.renderer.render(this.scene, this.camera);
    this.composer.render();
    window.requestAnimationFrame(this.render.bind(this));
  }
}

new Sketch();
