import { useLoader } from '@react-three/fiber'
import backgroundPano from '@renderer/assets/background.jpg'
import { BackSide, TextureLoader } from 'three'

interface Background360Props {
  imageUrl?: string
  radius?: number
}

/**
 * 360-degree panoramic background sphere
 * Uses equirectangular projection for immersive backgrounds
 */
export const Background360: React.FC<Background360Props> = (props) => {
  const { imageUrl = backgroundPano, radius = 500 } = props
  const texture = useLoader(TextureLoader, imageUrl)

  return (
    <mesh>
      <sphereGeometry args={[radius, 60, 40]} />
      <meshBasicMaterial map={texture} side={BackSide} toneMapped={false} />
    </mesh>
  )
}
