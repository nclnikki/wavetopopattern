"use client"

import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useControls } from 'leva'

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform float uTime;
  uniform float uWaveSpeed;
  uniform float uPatternDensity;
  uniform float uContourThickness;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying vec2 vUv;

  // Simplex 2D noise
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
            -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
      dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    // Create wave movement
    vec2 waveUv = vUv;
    waveUv.x += sin(waveUv.y * 10.0 + uTime * uWaveSpeed) * 0.1;
    waveUv.y += cos(waveUv.x * 10.0 + uTime * uWaveSpeed) * 0.1;
    
    // Generate base noise pattern
    float n1 = snoise(waveUv * uPatternDensity + uTime * 0.2);
    float n2 = snoise(waveUv * uPatternDensity * 2.0 - uTime * 0.1);
    float n3 = snoise(waveUv * uPatternDensity * 4.0 + uTime * 0.15);
    
    // Combine noise layers
    float finalNoise = (n1 + n2 * 0.5 + n3 * 0.25) * 0.5 + 0.5;
    
    // Create contour lines
    float contour = fract(finalNoise * 8.0);
    contour = smoothstep(0.0, uContourThickness, contour) * (1.0 - smoothstep(1.0 - uContourThickness, 1.0, contour));
    
    // Color gradient based on position and noise
    vec3 baseColor = mix(uColorA, uColorB, length(waveUv - 0.5) + finalNoise * 0.2);
    
    // Add glow effect
    float glow = smoothstep(0.4, 0.6, contour);
    vec3 finalColor = mix(vec3(0.0), baseColor, glow);
    
    // Add subtle background illumination
    finalColor += baseColor * 0.1;
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`

function WaveTopoPattern() {
  const meshRef = useRef()
  const {
    waveSpeed,
    patternDensity,
    contourThickness,
    colorA,
    colorB
  } = useControls({
    waveSpeed: { value: 0.5, min: 0, max: 2, step: 0.1 },
    patternDensity: { value: 4, min: 1, max: 10, step: 0.5 },
    contourThickness: { value: 0.2, min: 0.05, max: 0.5, step: 0.05 },
    colorA: '#00ccff',
    colorB: '#cc00ff'
  })

  const uniformsRef = useRef({
    uTime: { value: 0 },
    uWaveSpeed: { value: waveSpeed },
    uPatternDensity: { value: patternDensity },
    uContourThickness: { value: contourThickness },
    uColorA: { value: new THREE.Color(colorA) },
    uColorB: { value: new THREE.Color(colorB) }
  })

  useFrame((state) => {
    const { clock } = state
    meshRef.current.material.uniforms.uTime.value = clock.getElapsedTime()
    meshRef.current.material.uniforms.uWaveSpeed.value = waveSpeed
    meshRef.current.material.uniforms.uPatternDensity.value = patternDensity
    meshRef.current.material.uniforms.uContourThickness.value = contourThickness
    meshRef.current.material.uniforms.uColorA.value.set(colorA)
    meshRef.current.material.uniforms.uColorB.value.set(colorB)
  })

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniformsRef.current}
      />
    </mesh>
  )
}

export default function Scene() {
  return (
    <div className="w-full h-screen bg-black">
      <Canvas camera={{ position: [0, 0, 1.5] }}>
        <WaveTopoPattern />
        <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} />
      </Canvas>
    </div>
  )
}

