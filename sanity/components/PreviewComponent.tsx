import React from 'react'
import { Card, Text, Stack, Flex, Badge } from '@sanity/ui'

interface PreviewComponentProps {
  title?: string
  subtitle?: string
  media?: React.ReactNode
  description?: string
  status?: 'published' | 'draft'
  category?: string
}

export function PreviewComponent({
  title,
  subtitle,
  media,
  description,
  status = 'draft',
  category,
}: PreviewComponentProps) {
  return (
    <Card padding={3} radius={2} shadow={1}>
      <Flex gap={3} align="flex-start">
        {media && (
          <div style={{ flexShrink: 0, width: 60, height: 60 }}>
            {media}
          </div>
        )}
        <Stack space={2} flex={1}>
          <Flex justify="space-between" align="flex-start">
            <Stack space={1}>
              {title && (
                <Text size={2} weight="semibold">
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text size={1} muted>
                  {subtitle}
                </Text>
              )}
            </Stack>
            <Flex gap={2}>
              {category && (
                <Badge tone="primary" mode="outline">
                  {category}
                </Badge>
              )}
              <Badge tone={status === 'published' ? 'positive' : 'caution'}>
                {status}
              </Badge>
            </Flex>
          </Flex>
          {description && (
            <Text size={1} style={{ color: 'var(--card-muted-fg-color)' }}>
              {description.length > 100
                ? `${description.substring(0, 100)}...`
                : description}
            </Text>
          )}
        </Stack>
      </Flex>
    </Card>
  )
}

// Multilingual preview component
interface MultilingualPreviewProps {
  bengaliTitle?: string
  englishTitle?: string
  bengaliSubtitle?: string
  englishSubtitle?: string
  media?: React.ReactNode
  status?: 'published' | 'draft'
}

export function MultilingualPreview({
  bengaliTitle,
  englishTitle,
  bengaliSubtitle,
  englishSubtitle,
  media,
  status = 'draft',
}: MultilingualPreviewProps) {
  return (
    <Card padding={3} radius={2} shadow={1}>
      <Flex gap={3} align="flex-start">
        {media && (
          <div style={{ flexShrink: 0, width: 60, height: 60 }}>
            {media}
          </div>
        )}
        <Stack space={3} flex={1}>
          <Flex justify="space-between" align="flex-start">
            <Stack space={2}>
              {/* English Content */}
              <Stack space={1}>
                <Badge tone="primary" mode="outline" fontSize={0}>
                  English
                </Badge>
                {englishTitle && (
                  <Text size={2} weight="semibold">
                    {englishTitle}
                  </Text>
                )}
                {englishSubtitle && (
                  <Text size={1} muted>
                    {englishSubtitle}
                  </Text>
                )}
              </Stack>
              
              {/* Bengali Content */}
              <Stack space={1}>
                <Badge tone="primary" mode="outline" fontSize={0}>
                  বাংলা
                </Badge>
                {bengaliTitle && (
                  <Text size={2} weight="semibold">
                    {bengaliTitle}
                  </Text>
                )}
                {bengaliSubtitle && (
                  <Text size={1} muted>
                    {bengaliSubtitle}
                  </Text>
                )}
              </Stack>
            </Stack>
            
            <Badge tone={status === 'published' ? 'positive' : 'caution'}>
              {status}
            </Badge>
          </Flex>
        </Stack>
      </Flex>
    </Card>
  )
}