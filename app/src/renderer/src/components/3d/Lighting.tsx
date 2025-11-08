import { SCENE_COLORS } from '@renderer/constants/theme'
import React from 'react'

export const Lighting: React.FC = () => {
  return (
    <>
      {/* Brighter ambient base lighting */}
      <ambientLight intensity={0.8} color="#ffffff" />

      {/* Main key light - bright and clear */}
      <directionalLight
        position={[10, 15, 8]}
        intensity={2.5}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />

      {/* Fill light - brighter */}
      <directionalLight position={[-8, 10, -8]} intensity={1.5} color="#e3f2fd" />

      {/* Rim light for depth */}
      <directionalLight position={[0, 5, -15]} intensity={1.0} color="#bbdefb" />

      {/* Additional top light for better model illumination */}
      <directionalLight position={[0, 20, 0]} intensity={1.2} color="#ffffff" />

      {/* Point lights for model highlights */}
      <pointLight position={[5, 8, 5]} intensity={1.5} color="#ffffff" distance={25} decay={2} />
      <pointLight position={[-5, 8, -5]} intensity={1.2} color="#e3f2fd" distance={25} decay={2} />

      {/* Spotlight for dramatic effect and reflections */}
      <spotLight
        position={[8, 12, 8]}
        angle={0.4}
        penumbra={0.5}
        intensity={2.0}
        color="#ffffff"
        castShadow
      />
    </>
  )
}
