'use client'

import { PortableText, PortableTextComponents } from '@portabletext/react'
import { PortableTextBlock } from '@portabletext/types'
import Image from 'next/image'
import { urlFor } from '@/lib/sanity'
import { cn } from '@/lib/utils'

interface RichTextProps {
  content: PortableTextBlock[]
  className?: string
  language?: 'bengali' | 'english'
}

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="mb-4 leading-relaxed text-gray-700">{children}</p>
    ),
    h1: ({ children }) => (
      <h1 className="mb-6 text-3xl font-bold text-gray-900 md:text-4xl">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="mb-5 text-2xl font-semibold text-gray-900 md:text-3xl">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-4 text-xl font-semibold text-gray-900 md:text-2xl">
        {children}
      </h3>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-6 border-l-4 border-primary-500 bg-primary-50 p-4 italic">
        <div className="text-primary-800">{children}</div>
      </blockquote>
    ),
  },
  marks: {
    strong: ({ children }) => (
      <strong className="font-semibold text-gray-900">{children}</strong>
    ),
    em: ({ children }) => (
      <em className="italic text-gray-700">{children}</em>
    ),
    link: ({ children, value }) => (
      <a
        href={value?.href}
        className="text-primary-600 underline decoration-primary-300 underline-offset-2 transition-colors hover:text-primary-700 hover:decoration-primary-500"
        target={value?.href?.startsWith('http') ? '_blank' : undefined}
        rel={value?.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    ),
  },
  types: {
    image: ({ value }) => {
      if (!value?.asset) return null
      
      return (
        <div className="my-8">
          <div className="relative overflow-hidden rounded-lg shadow-md">
            <Image
              src={urlFor(value).width(800).height(600).url()}
              alt={value.alt || ''}
              width={800}
              height={600}
              className="h-auto w-full object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px"
            />
          </div>
          {value.alt && (
            <p className="mt-2 text-center text-sm text-gray-600">
              {value.alt}
            </p>
          )}
        </div>
      )
    },
  },
}

export function RichText({ content, className, language = 'english' }: RichTextProps) {
  if (!content || content.length === 0) {
    return null
  }

  const fontClass = language === 'bengali' ? 'font-bengali' : 'font-english'

  return (
    <div className={cn('prose max-w-none', fontClass, className)}>
      <PortableText value={content} components={components} />
    </div>
  )
}