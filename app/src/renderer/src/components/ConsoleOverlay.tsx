import React, { useEffect, useRef } from 'react'

interface ConsoleOverlayProps {
  serialData: string[]
  isVisible: boolean
}

export const ConsoleOverlay: React.FC<ConsoleOverlayProps> = ({ serialData, isVisible }) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [serialData])

  if (!isVisible) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 24,
        right: 24,
        width: 400,
        height: 300,
        background: 'rgba(26, 26, 26, 0.85)',
        backdropFilter: 'blur(10px)',
        borderRadius: 12,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>Serial Console</span>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>{serialData.length} lines</span>
      </div>
      
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '12px 16px',
          fontFamily: 'monospace',
          fontSize: 12,
          color: '#9ca3af',
          lineHeight: 1.5,
        }}
      >
        {serialData.slice(-50).map((line, i) => (
          <div key={i} style={{ marginBottom: 4 }}>
            {line}
          </div>
        ))}
      </div>
    </div>
  )
}