import React from 'react'

export const Lighting: React.FC = () => {
  return (
    <>
      {/* Brighter ambient base lighting */}
      <ambientLight intensity={0.8} color="#ffffff" />

      {/* Main key light - bright and clear */}
      <directionalLight position={[10, 15, 8]} intensity={2.5} color="#ffffff" castShadow />

      {/* Fill light - brighter */}
      <directionalLight position={[-8, 10, -8]} intensity={1.5} color="#e3f2fd" />

      {/* Rim light for depth */}
      <directionalLight position={[0, 5, -15]} intensity={1.0} color="#bbdefb" />

      {/* Additional top light for better model illumination */}
      <directionalLight position={[0, 20, 0]} intensity={1.2} color="#ffffff" />

      {/* Point lights for model highlights */}
      <pointLight position={[5, 8, 5]} args={['#ffffff', 1.5, 25, 2]} />
      <pointLight position={[-5, 8, -5]} args={['#e3f2fd', 1.2, 25, 2]} />

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
