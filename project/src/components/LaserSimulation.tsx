import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface LaserSimulationProps {
  visualizationMode: 'holographic' | 'engraving' | 'forge';
  onComplete?: () => void;
}

export function LaserSimulation({ visualizationMode, onComplete }: LaserSimulationProps) {
  const laserRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const progressRef = useRef(0);
  const simulationTimeRef = useRef(0);

  const laserColor = useMemo(() => {
    switch (visualizationMode) {
      case 'holographic':
        return '#00ffff';
      case 'engraving':
        return '#4a9eff';
      case 'forge':
        return '#ff4500';
      default:
        return '#00ffff';
    }
  }, [visualizationMode]);

  const particleCount = 500;
  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const color = new THREE.Color(laserColor);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 3;
      positions[i3 + 1] = Math.random() * 4 - 2;
      positions[i3 + 2] = (Math.random() - 0.5) * 3;

      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      sizes[i] = Math.random() * 0.05 + 0.02;
    }

    return { positions, colors, sizes };
  }, [laserColor]);

  useFrame((state, delta) => {
    simulationTimeRef.current += delta;
    progressRef.current = Math.min(simulationTimeRef.current / 5, 1);

    if (laserRef.current) {
      const radius = 0.3;
      const height = 8;
      const angle = simulationTimeRef.current * 2;

      laserRef.current.position.x = Math.cos(angle) * radius;
      laserRef.current.position.y = -2 + progressRef.current * 4;
      laserRef.current.position.z = Math.sin(angle) * radius;

      laserRef.current.rotation.z = angle;
    }

    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3 + 1] += Math.sin(simulationTimeRef.current + i) * 0.01;

        if (positions[i3 + 1] > 2) {
          positions[i3 + 1] = -2;
        }
      }

      particlesRef.current.geometry.attributes.position.needsUpdate = true;
      particlesRef.current.rotation.y += delta * 0.2;
    }

    if (progressRef.current >= 1 && onComplete) {
      onComplete();
    }
  });

  return (
    <group>
      <mesh ref={laserRef}>
        <cylinderGeometry args={[0.02, 0.02, 8, 8]} />
        <meshBasicMaterial color={laserColor} transparent opacity={0.8} />
      </mesh>

      <pointLight
        position={laserRef.current?.position || [0, 0, 0]}
        color={laserColor}
        intensity={5}
        distance={3}
      />

      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={particles.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={particleCount}
            array={particles.colors}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={particleCount}
            array={particles.sizes}
            itemSize={1}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          vertexColors
          transparent
          opacity={0.8}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      <mesh position={[0, -2, 0]}>
        <circleGeometry args={[3, 64]} />
        <meshBasicMaterial
          color={laserColor}
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
