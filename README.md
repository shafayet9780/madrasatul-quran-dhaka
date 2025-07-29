# Madrasatul Quran Website

A modern, bilingual website for Madrasatul Quran, an Islamic educational institution in Dhaka, Bangladesh. Built with Next.js 15+ and designed to combine traditional Islamic values with contemporary web technologies.

## Features

- **Bilingual Support**: Bengali and English language support with next-intl
- **Modern Design**: Islamic-inspired design system with Tailwind CSS
- **Content Management**: Sanity CMS integration for easy content updates
- **Performance Optimized**: Built for Bangladesh's internet infrastructure
- **Responsive Design**: Mobile-first approach with responsive layouts
- **SEO Optimized**: Search engine optimization for local discovery

## Tech Stack

- **Framework**: Next.js 15+ with App Router
- **Styling**: Tailwind CSS with custom Islamic design tokens
- **Internationalization**: next-intl for Bengali/English support
- **Content Management**: Sanity CMS
- **Typography**: Inter (English), Noto Sans Bengali, Amiri (Arabic)
- **Development**: TypeScript, ESLint, Prettier

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy environment variables:

   ```bash
   cp .env.local.example .env.local
   ```

4. Update environment variables in `.env.local` with your Sanity project details

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the website.

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Project Structure

```
src/
├── app/
│   ├── [locale]/          # Internationalized routes
│   ├── globals.css        # Global styles with Islamic design tokens
│   └── layout.tsx         # Root layout
├── components/
│   ├── layout/            # Layout components (Header, Footer)
│   └── ui/                # Reusable UI components
├── lib/
│   ├── sanity/            # Sanity CMS configuration
│   ├── utils/             # Utility functions
│   └── i18n.ts            # Internationalization config
├── types/
│   └── index.ts           # TypeScript type definitions
└── middleware.ts          # Next.js middleware for i18n
```

## Environment Variables

Required environment variables (see `.env.local.example`):

- `NEXT_PUBLIC_SANITY_PROJECT_ID` - Sanity project ID
- `NEXT_PUBLIC_SANITY_DATASET` - Sanity dataset name
- `SANITY_API_TOKEN` - Sanity API token
- `NEXT_PUBLIC_SITE_URL` - Site URL
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key

## Design System

The website uses a custom Islamic-inspired design system with:

- **Colors**: Islamic green primary, deep blue secondary, gold accents
- **Typography**: Multi-script support (Bengali, English, Arabic)
- **Spacing**: 8px base unit with 1.5x scale
- **Components**: Rounded corners, subtle shadows, smooth transitions

## Contributing

1. Follow the established code style (ESLint + Prettier)
2. Ensure all text content supports both Bengali and English
3. Test on multiple devices and browsers
4. Maintain cultural sensitivity in all content and imagery

## License

This project is proprietary and confidential.
