# Madrasatul Quran Website

A modern, bilingual website for Madrasatul Quran, an Islamic educational institution in Dhaka, Bangladesh. Built with Next.js 15+ and designed to combine traditional Islamic values with contemporary web technologies.

## Features

- **Bilingual Support**: Bengali and English language support with next-intl
- **Modern Design**: Islamic-inspired design system with Tailwind CSS
- **Content Management**: Sanity CMS integration for easy content updates
- **Performance Optimized**: Built for Bangladesh's internet infrastructure
- **Responsive Design**: Mobile-first approach with responsive layouts
- **Advanced Navigation**: Full-featured header with dropdown menus and mobile navigation
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

### Sanity Studio

The project includes an embedded Sanity Studio for content management:

- **Studio URL**: [http://localhost:3000/studio](http://localhost:3000/studio)
- **Access**: Available during development and can be deployed with the main site
- **Features**: Full content management interface with multilingual support
- **Enhanced UX**:
  - Automatic redirection to structure view when accessing studio root
  - Custom loading screen with Madrasatul Quran branding
  - Smooth transitions and professional loading experience
- **Authentication**:
  - Development: Open access for easy content management
  - Production: Optional basic authentication for security

#### Studio Features

**Enhanced User Experience**:

- **Smart Navigation**: Automatically redirects from `/studio` to `/studio/structure` for immediate access to content management
- **Custom Loading Screen**: Branded loading interface with Madrasatul Quran logo and styling
- **Responsive Design**: Optimized studio interface that works seamlessly across devices
- **Professional Branding**: Custom styling that reflects the institution's identity

**Authentication (Production)**:

For production deployments, you can enable basic authentication for the Sanity Studio by setting these environment variables:

```bash
STUDIO_AUTH_ENABLED=true
STUDIO_USERNAME=your_username
STUDIO_PASSWORD=your_secure_password
```

When enabled, users will need to provide credentials to access the studio at `/studio`.

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
│   ├── layout/            # Layout components (Header, Footer, Main Layout)
│   │   ├── header.tsx     # Enhanced responsive header with navigation
│   │   ├── footer.tsx     # Footer component with contact info
│   │   └── main-layout.tsx # Main layout wrapper
│   ├── ui/                # Reusable UI components
│   └── language-toggle.tsx # Language switching component
├── lib/
│   ├── sanity.ts          # Sanity client configuration
│   ├── sanity-queries.ts  # GROQ queries for content fetching
│   ├── sanity-utils.ts    # Sanity utility functions
│   ├── utils/             # General utility functions
│   └── i18n.ts            # Internationalization config
├── types/
│   ├── index.ts           # General TypeScript type definitions
│   └── sanity.ts          # Sanity-specific type definitions
└── middleware.ts          # Next.js middleware for i18n
```

## Content Management System

The website uses Sanity CMS for content management with the following features:

### Sanity Client Configuration

The Sanity client is configured in `src/lib/sanity.ts` using `next-sanity` for optimal Next.js integration:

- **Production Client**: Uses CDN for optimized performance in production environments
- **Preview Client**: Dedicated client for draft content preview with API token authentication
- **Image URL Builder**: Optimized image delivery with transformation and format conversion support
- **Flexible Client Selection**: Helper function for automatic client switching based on preview mode
- **Next.js Integration**: Built with `next-sanity` for better compatibility with Next.js App Router

### Content Types

- **Pages**: General website pages with multilingual content
- **News & Events**: News articles, events, achievements, and announcements
- **Academic Programs**: Islamic studies and NCTB curriculum programs
- **Staff Members**: Faculty and administration profiles
- **Facilities**: Campus facilities with photo galleries
- **Site Settings**: Global site configuration and contact information

### Usage Example

```typescript
import { client, previewClient, urlFor, getClient } from '@/lib/sanity';

// Fetch published content using main client
const data = await client.fetch(query);

// Fetch draft content using preview client
const draftData = await previewClient.fetch(query);

// Or use helper function for automatic client selection
const previewData = await getClient(true).fetch(query);

// Generate optimized image URLs with transformations
const imageUrl = urlFor(image)
  .width(800)
  .height(600)
  .format('webp')
  .quality(85)
  .url();
```

## Environment Variables

Required environment variables (see `.env.local.example`):

- `NEXT_PUBLIC_SANITY_PROJECT_ID` - Sanity project ID
- `NEXT_PUBLIC_SANITY_DATASET` - Sanity dataset name (usually 'production')
- `SANITY_API_TOKEN` - Sanity API token for preview mode and mutations
- `NEXT_PUBLIC_SITE_URL` - Site URL for SEO and social sharing
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key for location features

Optional environment variables for production security:

- `STUDIO_AUTH_ENABLED` - Set to 'true' to enable Sanity Studio authentication
- `STUDIO_USERNAME` - Username for Sanity Studio access (when auth is enabled)
- `STUDIO_PASSWORD` - Password for Sanity Studio access (when auth is enabled)

## Internationalization

The website includes comprehensive bilingual support:

- **Language Detection**: Automatic browser language detection with fallback to English
- **Dynamic Switching**: Real-time language switching without page reload
- **URL Structure**: Always includes locale prefix (e.g., `/english/about`, `/bengali/about`)
- **Font Support**: Optimized fonts for Bengali (Noto Sans Bengali), English (Inter), and Arabic (Amiri)
- **RTL Support**: Right-to-left text direction for Arabic content
- **CMS Integration**: All Sanity content types support Bengali and English fields
- **SEO Optimization**: Language-specific meta tags and structured data
- **Middleware Integration**: Custom middleware handles locale routing and Sanity Studio access

## Navigation System

The website features a comprehensive navigation system built into the header component:

### Desktop Navigation

- **Enhanced Header Design**: Gradient background from sand-light to white with backdrop blur effect for modern glass-morphism appearance
- **Logo**: Islamic calligraphy (Bismillah) with Bengali school name and English tagline
- **Main Menu**: Horizontal navigation with hover effects and smooth transitions
- **Programs Dropdown**: Expandable submenu for academic programs with sections for:
  - Islamic Studies curriculum
  - NCTB (National Curriculum) programs
  - Co-curricular activities
  - Academic calendar
- **Contact Integration**: Quick access phone number with click-to-call functionality
- **Language Toggle**: Seamless switching between Bengali and English
- **Accessibility**: Full ARIA support with proper labels and keyboard navigation

### Mobile Navigation

- **Hamburger Menu**: Slide-out navigation panel from the right side
- **Full-Screen Overlay**: Dark overlay with smooth animations
- **Collapsible Sections**: Programs submenu expands/collapses within mobile menu
- **Contact Footer**: Phone number and tagline in mobile menu footer
- **Responsive Design**: Optimized for touch interactions and various screen sizes
- **Body Scroll Lock**: Prevents background scrolling when menu is open

### Technical Features

- **State Management**: React hooks for menu states and dropdown visibility
- **Click Outside Detection**: Automatic dropdown closure when clicking elsewhere
- **Window Resize Handling**: Automatic mobile menu closure on desktop resize
- **Smooth Animations**: CSS transitions and transforms for all interactions
- **Performance Optimized**: Efficient event listeners with proper cleanup

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
