'use client';

import React from 'react';
import {
  Container,
  Grid,
  Section,
  Card,
  Heading,
  Text,
  IslamicButton,
  IslamicCard,
  IslamicDivider,
  IslamicPattern,

  Typography,
  Quote,
  List,
  ListItem,
  Badge,
  Flex,
  Divider,
} from '@/components/ui';

export function DesignSystemDemo() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Section variant="primary" padding="md">
        <Container>
          <Heading level={1} gradient className="text-center mb-4">
            Madrasatul Quran Design System
          </Heading>
          <Text size="lg" className="text-center text-green-700 max-w-3xl mx-auto">
            A comprehensive Islamic-inspired design system for modern educational websites
          </Text>
        </Container>
      </Section>

      {/* Typography Section */}
      <Section variant="default" padding="lg">
        <Container>
          <Heading level={2} className="mb-8">Typography System</Heading>
          
          <Grid cols={1} gap="lg" responsive={{ md: 2 }}>
            <Card>
              <Heading level={3} className="mb-4">English Typography</Heading>
              <div className="space-y-4">
                <Typography variant="h1" language="english">Heading 1 - Main Title</Typography>
                <Typography variant="h2" language="english">Heading 2 - Section Title</Typography>
                <Typography variant="h3" language="english">Heading 3 - Subsection</Typography>
                <Typography variant="body" language="english">
                  This is body text in English. It demonstrates the Inter font family with proper line height and spacing for optimal readability.
                </Typography>
              </div>
            </Card>

            <Card>
              <Heading level={3} className="mb-4">Bengali Typography</Heading>
              <div className="space-y-4">
                <Typography variant="h1" language="bengali">শিরোনাম ১ - মূল শিরোনাম</Typography>
                <Typography variant="h2" language="bengali">শিরোনাম ২ - বিভাগের শিরোনাম</Typography>
                <Typography variant="h3" language="bengali">শিরোনাম ৩ - উপবিভাগ</Typography>
                <Typography variant="body" language="bengali">
                  এটি বাংলা ভাষায় মূল লেখা। এটি নোটো সান্স বাংলা ফন্ট পরিবার প্রদর্শন করে যা সর্বোত্তম পাঠযোগ্যতার জন্য উপযুক্ত লাইন উচ্চতা এবং ব্যবধান সহ।
                </Typography>
              </div>
            </Card>
          </Grid>

          <Divider variant="ornate" spacing="xl" />

          <Card className="mt-8">
            <Heading level={3} className="mb-4">Arabic Typography</Heading>
            <div className="space-y-4">
              <Typography variant="h2" language="arabic">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم</Typography>
              <Typography variant="body" language="arabic">
                هَذَا نَصٌّ عَرَبِيٌّ يُظْهِرُ خَطَّ أَمِيرِي الْجَمِيلَ مَعَ التَّوْجِيهِ الصَّحِيحِ مِنَ الْيَمِينِ إِلَى الْيَسَارِ
              </Typography>
            </div>
          </Card>
        </Container>
      </Section>

      {/* Color Palette */}
      <Section variant="gray" padding="lg">
        <Container>
          <Heading level={2} className="mb-8">Islamic Color Palette</Heading>
          
          <Grid cols={1} gap="lg" responsive={{ md: 3 }}>
            <Card>
              <Heading level={4} className="mb-4 text-green-600">Primary - Islamic Green</Heading>
              <div className="grid grid-cols-5 gap-2">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                  <div key={shade} className="text-center">
                    <div 
                      className="w-full h-12 rounded mb-1"
                      style={{ backgroundColor: `var(--color-primary-${shade})` }}
                    />
                    <Text size="sm" className="text-gray-600">{shade}</Text>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <Heading level={4} className="mb-4 text-blue-600">Secondary - Deep Blue</Heading>
              <div className="grid grid-cols-5 gap-2">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                  <div key={shade} className="text-center">
                    <div 
                      className="w-full h-12 rounded mb-1"
                      style={{ backgroundColor: `var(--color-secondary-${shade})` }}
                    />
                    <Text size="sm" className="text-gray-600">{shade}</Text>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <Heading level={4} className="mb-4 text-yellow-600">Accent - Gold</Heading>
              <div className="grid grid-cols-5 gap-2">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                  <div key={shade} className="text-center">
                    <div 
                      className="w-full h-12 rounded mb-1"
                      style={{ backgroundColor: `var(--color-accent-${shade})` }}
                    />
                    <Text size="sm" className="text-gray-600">{shade}</Text>
                  </div>
                ))}
              </div>
            </Card>
          </Grid>
        </Container>
      </Section>

      {/* Buttons */}
      <Section variant="default" padding="lg">
        <Container>
          <Heading level={2} className="mb-8">Button Components</Heading>
          
          <Grid cols={1} gap="lg" responsive={{ md: 2 }}>
            <Card>
              <Heading level={4} className="mb-4">Button Variants</Heading>
              <Flex direction="col" gap="md" align="start">
                <IslamicButton variant="primary">Primary Button</IslamicButton>
                <IslamicButton variant="secondary">Secondary Button</IslamicButton>
                <IslamicButton variant="outline">Outline Button</IslamicButton>
                <IslamicButton variant="gold">Gold Button</IslamicButton>
                <IslamicButton variant="ghost">Ghost Button</IslamicButton>
              </Flex>
            </Card>

            <Card>
              <Heading level={4} className="mb-4">Button Sizes</Heading>
              <Flex direction="col" gap="md" align="start">
                <IslamicButton variant="primary" size="sm">Small Button</IslamicButton>
                <IslamicButton variant="primary" size="md">Medium Button</IslamicButton>
                <IslamicButton variant="primary" size="lg">Large Button</IslamicButton>
              </Flex>
            </Card>
          </Grid>
        </Container>
      </Section>

      {/* Islamic Patterns */}
      <Section variant="primary" padding="lg">
        <Container>
          <Heading level={2} className="mb-8">Islamic Patterns & Decorative Elements</Heading>
          
          <Grid cols={1} gap="lg" responsive={{ md: 3 }}>
            <Card className="relative h-32 overflow-hidden">
              <IslamicPattern pattern="dots" color="primary" intensity="medium" />
              <div className="relative z-10 p-4">
                <Text weight="semibold">Dots Pattern</Text>
              </div>
            </Card>

            <Card className="relative h-32 overflow-hidden">
              <IslamicPattern pattern="grid" color="secondary" intensity="medium" />
              <div className="relative z-10 p-4">
                <Text weight="semibold">Grid Pattern</Text>
              </div>
            </Card>

            <Card className="relative h-32 overflow-hidden">
              <IslamicPattern pattern="diagonal" color="accent" intensity="medium" />
              <div className="relative z-10 p-4">
                <Text weight="semibold">Diagonal Pattern</Text>
              </div>
            </Card>
          </Grid>

          <div className="mt-8">
            <Heading level={3} className="mb-4">Islamic Dividers</Heading>
            <div className="space-y-6">
              <IslamicDivider variant="simple" color="primary" />
              <IslamicDivider variant="ornate" color="accent" />
              <IslamicDivider variant="verse" color="secondary" />
              <IslamicDivider variant="geometric" color="primary" />
            </div>
          </div>
        </Container>
      </Section>

      {/* Cards */}
      <Section variant="default" padding="lg">
        <Container>
          <Heading level={2} className="mb-8">Card Components</Heading>
          
          <Grid cols={1} gap="lg" responsive={{ md: 2, lg: 4 }}>
            <IslamicCard variant="default">
              <div className="p-6">
                <Heading level={4} className="mb-2">Default Card</Heading>
                <Text>Standard card with Islamic shadow styling</Text>
              </div>
            </IslamicCard>

            <IslamicCard variant="elevated">
              <div className="p-6">
                <Heading level={4} className="mb-2">Elevated Card</Heading>
                <Text>Card with enhanced shadow for emphasis</Text>
              </div>
            </IslamicCard>

            <IslamicCard variant="bordered">
              <div className="p-6">
                <Heading level={4} className="mb-2">Bordered Card</Heading>
                <Text>Card with Islamic green border</Text>
              </div>
            </IslamicCard>

            <IslamicCard variant="gradient" pattern="dots">
              <div className="p-6">
                <Heading level={4} className="mb-2">Gradient Card</Heading>
                <Text>Card with subtle gradient and pattern</Text>
              </div>
            </IslamicCard>
          </Grid>
        </Container>
      </Section>

      {/* Content Components */}
      <Section variant="gray" padding="lg">
        <Container>
          <Heading level={2} className="mb-8">Content Components</Heading>
          
          <Grid cols={1} gap="lg" responsive={{ md: 2 }}>
            <Card>
              <Heading level={3} className="mb-4">Quotes</Heading>
              
              <Quote
                variant="islamic"
                language="english"
                author="Prophet Muhammad (PBUH)"
                source="Sahih Bukhari"
                className="mb-6"
              >
                Seek knowledge from the cradle to the grave.
              </Quote>

              <Quote
                variant="highlighted"
                language="bengali"
                author="আল্লামা ইকবাল"
                className="mb-6"
              >
                শিক্ষাই জাতির মেরুদণ্ড। শিক্ষা ছাড়া কোনো জাতি উন্নতি করতে পারে না।
              </Quote>
            </Card>

            <Card>
              <Heading level={3} className="mb-4">Lists & Badges</Heading>
              
              <List type="unordered" variant="islamic" className="mb-6">
                <ListItem>Quran Memorization Program</ListItem>
                <ListItem>Arabic Language Studies</ListItem>
                <ListItem>Islamic History & Culture</ListItem>
                <ListItem>NCTB Curriculum Integration</ListItem>
              </List>

              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="primary">Primary</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="accent">Accent</Badge>
                  <Badge variant="success">Success</Badge>
                </div>
              </div>
            </Card>
          </Grid>
        </Container>
      </Section>

      {/* Responsive Demonstration */}
      <Section variant="accent" padding="lg">
        <Container>
          <Heading level={2} className="mb-8">Responsive Design</Heading>
          
          <Card>
            <Text className="mb-4">
              This design system is built with mobile-first responsive design principles:
            </Text>
            
            <List type="unordered">
              <ListItem>Mobile (xs): 475px and up</ListItem>
              <ListItem>Small (sm): 640px and up</ListItem>
              <ListItem>Medium (md): 768px and up</ListItem>
              <ListItem>Large (lg): 1024px and up</ListItem>
              <ListItem>Extra Large (xl): 1280px and up</ListItem>
              <ListItem>2X Large (2xl): 1536px and up</ListItem>
            </List>
          </Card>
        </Container>
      </Section>

      {/* Footer */}
      <Section variant="primary" padding="md">
        <Container>
          <Text className="text-center text-green-700">
            Madrasatul Quran Design System - Built with Islamic values and modern web standards
          </Text>
        </Container>
      </Section>
    </div>
  );
}