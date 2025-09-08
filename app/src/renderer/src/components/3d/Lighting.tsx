import React from 'react'

export const Lighting: React.FC = () => {
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-10, 10, -5]} intensity={0.8} />
      <pointLight position={[0, 5, 0]} intensity={0.5} color="#a3e635" />
      <spotLight
        position={[5, 10, 5]}
        angle={0.3}
        penumbra={0.5}
        intensity={1}
        castShadow
      />
    </>
  )
}