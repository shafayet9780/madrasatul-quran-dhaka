import React from 'react'
import { Text, Flex } from '@sanity/ui'

export function StudioLogo() {
  return (
    <Flex align="center" gap={2}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '14px',
          fontWeight: 'bold',
        }}
      >
        MQ
      </div>
      <Text size={2} weight="semibold">
        Madrasatul Quran
      </Text>
    </Flex>
  )
}