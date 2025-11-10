import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { CAMERA_PRESETS, useCameraStore } from '@renderer/store/cameraStore'
import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

interface CameraControllerProps {
  autoRotate?: boolean
}

export const CameraController: React.FC<CameraControllerProps> = (props) => {
  const { autoRotate = false } = props
  const { camera } = useThree()
  const { currentPreset, setTransitioning } = useCameraStore()
  const orbitControlsRef = useRef<OrbitControlsImpl>(null)

  // Track current camera position for smooth transitions
  const currentPosition = useRef(new THREE.Vector3())
  const currentTarget = useRef(new THREE.Vector3())
  const targetPosition = useRef(new THREE.Vector3())
  const targetLookAt = useRef(new THREE.Vector3())
  const isTransitioningRef = useRef(false)

  // Update target when preset changes
  useEffect(() => {
    // If switching to free mode, just enable controls and leave camera where it is
    if (currentPreset === 'free') {
      isTransitioningRef.current = false
      setTransitioning(false)
      if (orbitControlsRef.current) {
        // Don't change anything - just enable the controls from current state
        orbitControlsRef.current.enabled = true
      }
      return
    }

    const preset = CAMERA_PRESETS[currentPreset]
    targetPosition.current.set(...preset.position)
    targetLookAt.current.set(...preset.target)

    // Start transition if we're not already at this position
    const distance = camera.position.distanceTo(targetPosition.current)
    if (distance > 0.1) {
      isTransitioningRef.current = true
      setTransitioning(true)

      // Disable orbit controls during transition
      if (orbitControlsRef.current) {
        orbitControlsRef.current.enabled = false
      }
    }
  }, [currentPreset, camera, setTransitioning])

  // Smooth camera transitions
  useFrame((_, delta) => {
    if (isTransitioningRef.current) {
      // Lerp camera position
      currentPosition.current.copy(camera.position)
      currentPosition.current.lerp(targetPosition.current, delta * 3) // Speed: 3
      camera.position.copy(currentPosition.current)

      // Lerp camera look-at target
      currentTarget.current.lerp(targetLookAt.current, delta * 3)
      camera.lookAt(currentTarget.current)

      // Update orbit controls target
      if (orbitControlsRef.current) {
        orbitControlsRef.current.target.copy(currentTarget.current)
        orbitControlsRef.current.update()
      }

      // Check if transition is complete
      const posDistance = camera.position.distanceTo(targetPosition.current)
      const targetDistance = currentTarget.current.distanceTo(targetLookAt.current)

      if (posDistance < 0.01 && targetDistance < 0.01) {
        isTransitioningRef.current = false
        setTransitioning(false)

        // Re-enable orbit controls if in free mode
        if (orbitControlsRef.current && currentPreset === 'free') {
          orbitControlsRef.current.enabled = true
        }
      }
    }
  })

  return (
    <>
      <PerspectiveCamera makeDefault position={[8, 6, 8]} fov={60} near={0.1} far={1000} />
      <OrbitControls
        ref={orbitControlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        enabled={currentPreset === 'free'} // Only enabled in free mode
        autoRotate={autoRotate && currentPreset === 'free'}
        autoRotateSpeed={0.5}
        minDistance={3}
        maxDistance={20}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  )
}
