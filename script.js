import * as THREE from "https://esm.sh/three";
import { OrbitControls } from "https://esm.sh/three/examples/jsm/controls/OrbitControls.js";
import GUI from "https://cdn.jsdelivr.net/npm/lil-gui@0.18/+esm";

// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Smooth camera movement

// Plane Geometry
const planeGeometry = new THREE.PlaneGeometry(10, 10, 100, 100);

// Shader Material
const shaderMaterial = new THREE.ShaderMaterial({
  vertexShader: `
    uniform float uTime;
    uniform float uAmplitude;
    uniform float uFrequency;
    uniform vec2 uMouse;
    varying vec3 vColor;

    void main() {
      // Calculate distance from mouse
      float dist = distance(uv, uMouse);

      // Create a popping effect
      float wave = sin(uTime * uFrequency + position.x * 5.0) * uAmplitude;
      float pop = smoothstep(0.2, 0.0, dist) * 2.0;

      vec3 newPosition = position + normal * (wave + pop);

      vColor = vec3(1.0 - dist, 0.5, dist); // Color gradient
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    varying vec3 vColor;

    void main() {
      // Interpolate between two colors based on vColor
      vec3 color = mix(uColor1, uColor2, vColor.r);
      gl_FragColor = vec4(color, 1.0);
    }
  `,
  uniforms: {
    uTime: { value: 0 },
    uAmplitude: { value: 0.2 }, // Wave height
    uFrequency: { value: 2.0 }, // Wave speed
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uColor1: { value: new THREE.Color(0xff0000) }, // Start color (red)
    uColor2: { value: new THREE.Color(0x0000ff) }, // End color (blue)
  },
  side: THREE.DoubleSide,
  wireframe: true,
});

// Mesh
const plane = new THREE.Mesh(planeGeometry, shaderMaterial);
scene.add(plane);

// Position camera
camera.position.z = 5;

// Handle mouse movement
const mouse = new THREE.Vector2();
window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  shaderMaterial.uniforms.uMouse.value.set(mouse.x * 0.5 + 0.5, mouse.y * 0.5 + 0.5);
});

// Debug Controls (dat.GUI)
const gui = new GUI();
const debugFolder = gui.addFolder('Shader Controls');
debugFolder.add(shaderMaterial.uniforms.uAmplitude, 'value', 0, 1).name('Wave Amplitude'); // Wave height control
debugFolder.add(shaderMaterial.uniforms.uFrequency, 'value', 0.5, 5).name('Wave Frequency'); // Wave speed control
debugFolder.addColor(shaderMaterial.uniforms.uColor1, 'value').name('Start Color'); // Start color control
debugFolder.addColor(shaderMaterial.uniforms.uColor2, 'value').name('End Color'); // End color control
debugFolder.add(plane.material, 'wireframe').name('Wireframe');
debugFolder.open();

// Animation loop
const clock = new THREE.Clock();
function animate() {
  shaderMaterial.uniforms.uTime.value = clock.getElapsedTime();
  controls.update(); // Update OrbitControls
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

// Handle resizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
