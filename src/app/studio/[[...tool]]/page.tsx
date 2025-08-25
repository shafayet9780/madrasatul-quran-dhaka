'use client'

import { NextStudio } from 'next-sanity/studio'
import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import config from '../../../../sanity.config'

export default function StudioPage() {
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    // If no tool is specified (empty array or undefined), redirect to structure
    if (!params.tool || params.tool.length === 0) {
      router.replace('/studio/structure')
      return
    }
  }, [params.tool, router])

  // Check if we have a valid tool parameter
  const hasValidTool = params.tool && params.tool.length > 0
  
  // Show loading only when redirecting from empty studio path
  if (!hasValidTool) {
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

  // Render the studio for any valid tool (including structure)
  return <NextStudio config={config} />
}

// Ensure the page is dynamically rendered
export const dynamic = 'force-dynamic'