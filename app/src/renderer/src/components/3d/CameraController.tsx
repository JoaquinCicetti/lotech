import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import React from 'react'

interface CameraControllerProps {
  autoRotate?: boolean
}

export const CameraController: React.FC<CameraControllerProps> = (props) => {
  const { autoRotate = false } = props

  return (
    <>
      <PerspectiveCamera makeDefault position={[13, 7, 5]} fov={60} near={0.1} far={1000} />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        autoRotate={autoRotate}
        autoRotateSpeed={0.5}
        minDistance={3}
        maxDistance={20}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  )
}
