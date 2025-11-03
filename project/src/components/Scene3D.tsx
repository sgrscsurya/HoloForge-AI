import { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { LaserSimulation } from './LaserSimulation';

interface Scene3DProps {
  modelUrl?: string;
  visualizationMode: 'holographic' | 'engraving' | 'forge';
  isSimulating: boolean;
  onSimulationComplete?: () => void;
}

function Model({ url, mode, isSimulating }: { url?: string; mode: string; isSimulating: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    if (url) {
      const loader = new THREE.TextureLoader();
      loader.load(url, (texture) => {
        const planeGeometry = new THREE.PlaneGeometry(2, 2, 50, 50);
        setGeometry(planeGeometry);
      });
    } else {
      const boxGeometry = new THREE.BoxGeometry(2, 2, 2, 10, 10, 10);
      setGeometry(boxGeometry);
    }
  }, [url]);

  useFrame((state) => {
    if (meshRef.current && !isSimulating) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  if (!geometry) return null;

  const getMaterial = () => {
    switch (mode) {
      case 'holographic':
        return (
          <meshPhysicalMaterial
            color="#00ffff"
            transparent
            opacity={0.6}
            metalness={0.9}
            roughness={0.1}
            transmission={0.5}
            thickness={0.5}
            wireframe={false}
          />
        );
      case 'engraving':
        return (
          <meshStandardMaterial
            color="#4a9eff"
            wireframe
            wireframeLinewidth={2}
          />
        );
      case 'forge':
        return (
          <meshStandardMaterial
            color="#ff6b35"
            emissive="#ff4500"
            emissiveIntensity={0.5}
            metalness={0.8}
            roughness={0.2}
          />
        );
      default:
        return <meshStandardMaterial color="#00ffff" />;
    }
  };

  return (
    <mesh ref={meshRef} geometry={geometry}>
      {getMaterial()}
    </mesh>
  );
}

function Lighting({ mode }: { mode: string }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={mode === 'forge' ? 2 : 1} color={mode === 'forge' ? '#ff6b35' : '#ffffff'} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#00ffff" />
      <spotLight
        position={[0, 10, 0]}
        angle={0.3}
        penumbra={1}
        intensity={mode === 'holographic' ? 2 : 1}
        color="#00ffff"
        castShadow
      />
    </>
  );
}

function GridFloor() {
  return (
    <gridHelper args={[20, 20, '#00ffff', '#1a1a2e']} position={[0, -2, 0]} />
  );
}

export function Scene3D({ modelUrl, visualizationMode, isSimulating, onSimulationComplete }: Scene3DProps) {
  return (
    <div className="w-full h-full relative">
      <Canvas shadows className="bg-transparent">
        <PerspectiveCamera makeDefault position={[0, 2, 6]} fov={50} />

        <Suspense fallback={null}>
          <Lighting mode={visualizationMode} />
          <Model url={modelUrl} mode={visualizationMode} isSimulating={isSimulating} />

          {isSimulating && (
            <LaserSimulation
              visualizationMode={visualizationMode}
              onComplete={onSimulationComplete}
            />
          )}

          <GridFloor />
          <Environment preset="city" />
        </Suspense>

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={!isSimulating}
          minDistance={3}
          maxDistance={15}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>

      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/50 via-transparent to-transparent" />
    </div>
  );
}
