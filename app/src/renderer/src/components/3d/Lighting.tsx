import React from 'react'

export const Lighting: React.FC = () => {
  // Machine is at [1, 6.8, -7.5]
  const machinePosition: [number, number, number] = [1, 6.8, -7.5]

  return (
    <>
      {/* Dim ambient lighting for darker scene */}
      <ambientLight intensity={0.15} color="#ffffff" />

      {/* Main spotlight focused on machine */}
      <spotLight
        position={[machinePosition[0] + 1, machinePosition[1] + 6, machinePosition[2] - 2]}
        angle={Math.PI / 4}
        penumbra={0.1}
        intensity={20}
        color="#ffffff"
      />

      {/* Accent lights around machine */}
      <pointLight
        position={[machinePosition[0] + 2, machinePosition[1] + 2, machinePosition[2] + 2]}
        args={['#ffffff', 1.5, 6, 0.5]}
      />

      <pointLight
        position={[machinePosition[0] + 2, machinePosition[1] + 2, machinePosition[2] - 4]}
        args={['#ffffff', 1.5, 6, 0.5]}
      />

      <pointLight
        position={[machinePosition[0] - 0.4, machinePosition[1] + 1.5, machinePosition[2] + 2]}
        args={['#ffffff', 0.1, 5, 0.5]}
      />

      {/* Table lamp lights - positioned to illuminate machine from sides/below */}
      <pointLight position={[-3, 2, -6.5]} args={['#fff8e1', 5.0, 20, 1]} />

      {/* <pointLight position={[3, 2, -6.5]} args={['#fff8e1', 4.5, 18, 1]} /> */}
      {/* <pointLight position={[0, 1, -4]} args={['#ffffff', 4.0, 15, 1]} /> */}
    </>
  )
}
