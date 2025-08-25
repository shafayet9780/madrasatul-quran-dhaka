'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function StudioIndexPage() {
  const router = useRouter()

  useEffect(() => {
    // Immediately redirect to structure
    router.replace('/studio/structure')
  }, [router])

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      fontFamily: 'system-ui, sans-serif',
      backgroundColor: '#f1f5f9'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            margin: '0 auto 1rem'
          }}>
            MQ
          </div>
        </div>
        <div>Redirecting to Madrasatul Quran CMS...</div>
      </div>
    </div>
  )
}