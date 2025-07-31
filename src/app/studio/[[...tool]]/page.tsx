'use client'

import { NextStudio } from 'next-sanity/studio'
import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import config from '../../../../sanity.config'

export default function StudioPage() {
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    // If no tool is specified, redirect to structure
    if (!params.tool || params.tool.length === 0) {
      router.replace('/studio/structure')
    }
  }, [params.tool, router])

  // Show loading while redirecting
  if (!params.tool || params.tool.length === 0) {
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
          <div>Loading Madrasatul Quran CMS...</div>
        </div>
      </div>
    )
  }

  return <NextStudio config={config} />
}

// Ensure the page is dynamically rendered
export const dynamic = 'force-dynamic'