import { useFrame } from '@react-three/fiber'
import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

interface LightingProps {
  isConnected?: boolean
}

export const Lighting: React.FC<LightingProps> = ({ isConnected = false }) => {
  // Machine is at [2, 6.8, -7.5]
  const machinePosition: [number, number, number] = [2, 6.8, -7.5]

  // Refs for animated lights
  const ambientRef = useRef<THREE.AmbientLight>(null)
  const spotRef = useRef<THREE.SpotLight>(null)
  const point1Ref = useRef<THREE.PointLight>(null)
  const point2Ref = useRef<THREE.PointLight>(null)
  const point3Ref = useRef<THREE.PointLight>(null)
  const tableLampRef = useRef<THREE.PointLight>(null)

  // Target intensities - start at 0 (completely off)
  const [targetAmbient, setTargetAmbient] = useState(0)
  const [targetSpot, setTargetSpot] = useState(0)
  const [targetPoint1, setTargetPoint1] = useState(0)
  const [targetPoint2, setTargetPoint2] = useState(0)
  const [targetPoint3, setTargetPoint3] = useState(0)
  const [targetTableLamp, setTargetTableLamp] = useState(0)

  const [hasStartedUp, setHasStartedUp] = useState(false)

  // Startup animation - turn lights on once when component mounts
  useEffect(() => {
    if (hasStartedUp) return

    // Delay slightly then turn on to disconnected state over 500ms
    const startupTimer = setTimeout(() => {
      setTargetAmbient(0.05)
      setTargetSpot(8)
      setTargetPoint1(0.5)
      setTargetPoint2(0.5)
      setTargetPoint3(0.03)
      setTargetTableLamp(2.0)
      setHasStartedUp(true)
    }, 100)

    return () => clearTimeout(startupTimer)
  }, [hasStartedUp])

  // Update targets when connection state changes
  useEffect(() => {
    if (!hasStartedUp) return // Wait for startup to complete

    if (isConnected) {
      // Connected state - full brightness
      setTargetAmbient(0.15)
      setTargetSpot(20)
      setTargetPoint1(1.5)
      setTargetPoint2(1.5)
      setTargetPoint3(0.1)
      setTargetTableLamp(5.0)
    } else {
      // Disconnected state - dim lights
      setTargetAmbient(0.05)
      setTargetSpot(8)
      setTargetPoint1(0.5)
      setTargetPoint2(0.5)
      setTargetPoint3(0.03)
      setTargetTableLamp(2.0)
    }
  }, [isConnected, hasStartedUp])

  // Animate light intensities smoothly
  useFrame((_, delta) => {
    // Fast lerp for quick transitions
    const lerpFactor = Math.min(delta * 5.0, 1)

    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.lerp(
        ambientRef.current.intensity,
        targetAmbient,
        lerpFactor
      )
    }

    if (spotRef.current) {
      spotRef.current.intensity = THREE.MathUtils.lerp(
        spotRef.current.intensity,
        targetSpot,
        lerpFactor
      )
    }

    if (point1Ref.current) {
      point1Ref.current.intensity = THREE.MathUtils.lerp(
        point1Ref.current.intensity,
        targetPoint1,
        lerpFactor
      )
    }

    if (point2Ref.current) {
      point2Ref.current.intensity = THREE.MathUtils.lerp(
        point2Ref.current.intensity,
        targetPoint2,
        lerpFactor
      )
    }

    if (point3Ref.current) {
      point3Ref.current.intensity = THREE.MathUtils.lerp(
        point3Ref.current.intensity,
        targetPoint3,
        lerpFactor
      )
    }

    if (tableLampRef.current) {
      tableLampRef.current.intensity = THREE.MathUtils.lerp(
        tableLampRef.current.intensity,
        targetTableLamp,
        lerpFactor
      )
    }
  })

  return (
    <>
      {/* Dim ambient lighting for darker scene */}
      <ambientLight ref={ambientRef} intensity={0} color="#ffffff" />

      {/* Main spotlight focused on machine */}
      <spotLight
        ref={spotRef}
        position={[machinePosition[0] + 1, machinePosition[1] + 6, machinePosition[2] - 2]}
        angle={Math.PI / 4}
        penumbra={0.1}
        intensity={0}
        color="#ffffff"
      />

      {/* Accent lights around machine */}
      <pointLight
        ref={point1Ref}
        position={[machinePosition[0] + 2, machinePosition[1] + 2, machinePosition[2] + 2]}
        args={['#ffffff', 0, 6, 0.5]}
      />

      <pointLight
        ref={point2Ref}
        position={[machinePosition[0] + 2, machinePosition[1] + 2, machinePosition[2] - 4]}
        args={['#ffffff', 0, 6, 0.5]}
      />

      {/* <pointLight
        ref={point3Ref}
        position={[machinePosition[0] - 0.4, machinePosition[1] + 1.5, machinePosition[2] + 2]}
        args={['#ffffff', 0, 5, 0.5]}
      /> */}

      {/* Table lamp lights - positioned to illuminate machine from sides/below */}
      {/* <pointLight ref={tableLampRef} position={[-3, 2, -6.5]} args={['#fff8e1', 0, 20, 1]} /> */}

      {/* <pointLight position={[3, 2, -6.5]} args={['#fff8e1', 4.5, 18, 1]} /> */}
      {/* <pointLight position={[0, 1, -4]} args={['#ffffff', 4.0, 15, 1]} /> */}
    </>
  )
}
