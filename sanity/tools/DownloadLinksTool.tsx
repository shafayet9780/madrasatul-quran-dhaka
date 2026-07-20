'use client'

import { Box, Card, Heading, Stack, Text } from '@sanity/ui'
import { DownloadShareDialog } from '../components/DownloadShareDialog'

export function DownloadLinksTool() {
  return (
    <Box padding={5}>
      <Card padding={5} radius={2} shadow={1} style={{ margin: '0 auto', maxWidth: 640 }}>
        <Stack space={4}>
          <Heading size={2}>Downloads library link</Heading>
          <Text muted>
            Generate a link that can browse every currently published category and resource.
          </Text>
          <DownloadShareDialog scope="library" />
        </Stack>
      </Card>
    </Box>
  )
}
