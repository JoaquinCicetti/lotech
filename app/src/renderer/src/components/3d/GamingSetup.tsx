import { useGLTF } from '@react-three/drei'
import React from 'react'

const GAMING_SETUP_URL = new URL('../../assets/gaming_setup.glb', import.meta.url).href

interface GamingSetupProps {
  position: [number, number, number]
  scale: number
}

export const GamingSetup: React.FC<GamingSetupProps> = (props) => {
  const { position, scale } = props
  const { scene } = useGLTF(GAMING_SETUP_URL)

  return <primitive object={scene} position={position} scale={[scale, scale, scale]} />
}

// Preload the model
useGLTF.preload(GAMING_SETUP_URL)
