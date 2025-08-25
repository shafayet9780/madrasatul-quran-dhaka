# Madrasatul Quran Website

A modern, bilingual website for Madrasatul Quran, an Islamic educational institution in Dhaka, Bangladesh. Built with Next.js 15+ and designed to combine traditional Islamic values with contemporary web technologies.

## Features

- **Bilingual Support**: Bengali and English language support with next-intl
- **Modern Design**: Islamic-inspired design system with Tailwind CSS
- **Content Management**: Sanity CMS integration for easy content updates
- **Performance Optimized**: Built for Bangladesh's internet infrastructure
- **Responsive Design**: Mobile-first approach with responsive layouts
- **Advanced Navigation**: Full-featured header with dropdown menus and mobile navigation
- **About Page**: Complete institutional information with history, leadership, and philosophy
- **Academic Programs**: Comprehensive curriculum display with Islamic studies, NCTB curriculum, and co-curricular activities
- **Admissions System**: Complete enrollment process with requirements, fee calculator, and inquiry forms
- **News and Events**: Comprehensive news system with calendar view, photo galleries, and event RSVP
- **SEO Optimized**: Search engine optimization for local discovery

## Tech Stack

- **Framework**: Next.js 15+ with App Router
- **Styling**: Tailwind CSS with custom Islamic design tokens
- **Internationalization**: next-intl for Bengali/English support
- **Content Management**: Sanity CMS with multilingual support
- **Typography**: Inter (English), Noto Sans Bengali, Amiri (Arabic)
- **Development**: TypeScript, ESLint, Prettier, tsx (TypeScript execution)
- **Performance**: Optimized images with WebP/AVIF, SWC minification, compression enabled

## Content Management System

This website features a comprehensive content management system built on Sanity CMS with full multilingual support.

### Content Types

- **Site Settings**: Global configuration, contact info, statistics
- **Pages**: Static content pages (About, History, Vision, etc.)
- **News & Events**: Dynamic content with categories, featured items, and galleries
- **Academic Programs**: Educational programs with Islamic and NCTB curricula
- **Staff Members**: Faculty and administration with leadership team
- **Facilities**: Campus facilities with categories and features

### Multilingual Content Management

- **Dual Language Support**: All content supports Bengali and English
- **Translation Workflow**: Built-in translation task management
- **Content Validation**: Language-specific quality checks
- **Translation Dashboard**: React components for managing translations
- **Progress Tracking**: Statistics and reporting for translation completeness

### Content Features

- **Preview Mode**: Live preview of unpublished content
- **Publishing Workflow**: Draft → Review → Approved → Published states
- **Media Management**: Optimized image handling with Sanity CDN
- **Content Validation**: Comprehensive validation with error reporting
- **SEO Integration**: Meta tags and structured data support

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

4. Configure Sanity CMS:
   - Set up your Sanity project at [sanity.io](https://sanity.io)
   - Add your project ID and dataset to `.env.local`
   - Generate an API token with write permissions
   - Add the token to `.env.local` as `SANITY_API_TOKEN`

5. Populate sample data (optional):

   ```bash
   npm run populate-sanity populate
   # Or use TypeScript version
   npm run populate-sanity:ts populate
   # Or run directly with tsx
   npx tsx scripts/populate-sanity-data.ts populate
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

**Note**: The project provides both JavaScript and TypeScript versions of key scripts. JavaScript versions are used by default for faster execution and broader compatibility, while TypeScript versions (with `:ts` suffix) provide full type checking.

#### Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

#### TypeScript Execution
The project includes `tsx` for direct TypeScript execution without compilation:
- `npx tsx <script.ts>` - Run any TypeScript file directly
- `npx tsx scripts/populate-sanity-data.ts populate` - Run data population script (TypeScript)
- `npx tsx scripts/test-content-integration.ts` - Run content integration tests (TypeScript)

#### Script Versions
Both JavaScript and TypeScript versions of key scripts are available:
- **JavaScript versions** (default): Faster execution, no TypeScript dependencies required
- **TypeScript versions** (`:ts` suffix): Full type checking and modern syntax support

#### Content Management
- `npm run populate-sanity populate` - Populate Sanity with sample data (JavaScript version)
- `npm run populate-sanity:ts populate` - Populate Sanity with sample data (TypeScript version)
- `npm run populate-sanity cleanup` - Remove all test data from Sanity
- `npm run populate-sanity test-connection` - Test Sanity connection
- `npm run test-content` - Test content management integration (JavaScript version)
- `npm run test-content:ts` - Test content management integration (TypeScript version)
- `npx tsx scripts/populate-sanity-data.ts [command]` - Direct script execution with tsx

#### Sanity Studio
- `npm run sanity` - Start Sanity Studio development server
- `npm run sanity:build` - Build Sanity Studio for production
- `npm run sanity:deploy` - Deploy Sanity Studio

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
│   ├── homepage/          # Homepage-specific components
│   │   ├── hero-section.tsx # Hero section with dynamic content integration
│   │   ├── mission-statistics-section.tsx # Mission statement and statistics
│   │   └── featured-content-section.tsx # Featured content and quick access
│   ├── about/             # About page components
│   │   ├── school-history-vision.tsx # School history and vision section
│   │   ├── leadership-team.tsx # Leadership team with modal profiles
│   │   └── educational-philosophy.tsx # Educational philosophy and accreditation
│   ├── programs/          # Academic programs components
│   │   ├── islamic-studies-section.tsx # Islamic curriculum display
│   │   ├── nctb-curriculum-section.tsx # NCTB curriculum with search/filter
│   │   └── co-curricular-section.tsx # Co-curricular activities by category
│   ├── admissions/        # Admissions page components
│   │   ├── requirements-section.tsx # Admission requirements and application process
│   │   ├── fee-structure-section.tsx # Fee structure and financial aid calculator
│   │   └── important-dates-section.tsx # Academic calendar and inquiry form
│   ├── campus/            # Campus and facilities page components
│   │   ├── virtual-tour-section.tsx # Self-contained virtual tour with curated gallery
│   │   ├── facilities-showcase.tsx # Dynamic facilities display with CMS integration
│   │   └── safety-security-section.tsx # Safety measures and emergency contacts
│   ├── news-events/       # News and events page components
│   │   ├── news-events-page.tsx # Main news and events page with tabs
│   │   ├── news-card.tsx  # Individual news/event card component
│   │   ├── events-calendar.tsx # Calendar view for events
│   │   ├── photo-gallery.tsx # Photo gallery with lightbox
│   │   ├── media-slideshow.tsx # Featured media slideshow
│   │   ├── search-bar.tsx # Real-time search functionality
│   │   ├── news-filters.tsx # Category filtering component
│   │   ├── news-article-page.tsx # Individual article page
│   │   └── event-rsvp.tsx # Event registration component
│   ├── ui/                # Reusable UI components
│   │   └── rich-text.tsx  # Rich text renderer for Sanity Portable Text
│   └── language-toggle.tsx # Language switching component
├── lib/
│   ├── sanity.ts          # Sanity client configuration
│   ├── sanity-queries.ts  # GROQ queries for content fetching
│   ├── sanity-utils.ts    # Sanity utility functions
│   ├── queries/           # Specialized query modules
│   │   └── news-events.ts # News and events GROQ queries
│   ├── utils/             # General utility functions
│   └── i18n.ts            # Internationalization config
├── types/
│   ├── index.ts           # General TypeScript type definitions
│   └── sanity.ts          # Sanity-specific type definitions
└── middleware.ts          # Next.js middleware for i18n
```

## Content Management System

The website uses Sanity CMS for comprehensive content management with enhanced multilingual support and structured data organization:

### Enhanced Type System

The project features a comprehensive TypeScript type system (`src/types/sanity.ts`) with:

**Contact Information Management**:
- **Structured Phone Numbers**: Categorized by type (main, admission, principal, emergency, department) with primary/active flags
- **Organized Email Addresses**: Typed by purpose (info, admission, principal, academic, support) with status management
- **Department Contacts**: Role-based contact organization with head assignments and contact details

**Social Media & Communication**:
- **Social Media Links**: Platform-specific configuration with icons, ordering, and active status
- **Prayer Times**: Multilingual prayer names with time management and display ordering
- **Office Hours**: Multilingual scheduling information

**Content Structure**:
- **Multilingual Text**: Consistent Bengali/English content support across all content types
- **Portable Text**: Rich content editing with Sanity's block editor
- **Image Management**: Advanced image handling with hotspot, crop, and caption support
- **SEO Integration**: Structured metadata and Open Graph support

### Sanity Client Configuration

The Sanity client is configured in `src/lib/sanity.ts` using `next-sanity` for optimal Next.js integration:

- **Production Client**: Uses CDN for optimized performance in production environments
- **Preview Client**: Dedicated client for draft content preview with API token authentication
- **Image URL Builder**: Optimized image delivery with transformation and format conversion support
- **Flexible Client Selection**: Helper function for automatic client switching based on preview mode
- **Next.js Integration**: Built with `next-sanity` for better compatibility with Next.js App Router

### Content Types

- **Site Settings**: Global site configuration with enhanced contact management
  - Multilingual title, description, and SEO settings
  - Advanced contact information with categorized phone/email entries
  - Social media links with platform icons and ordering
  - Prayer times management with multilingual names
  - Department contacts with role-based organization
  - School statistics and achievements tracking
- **Pages**: General website pages with multilingual content
- **News & Events**: News articles, events, achievements, and announcements
- **Academic Programs**: Comprehensive curriculum management with:
  - Islamic Studies curriculum (Quran, Hadith, Fiqh, Arabic)
  - NCTB curriculum integration with subject-wise breakdown
  - Co-curricular activities with category-based organization
  - Prerequisites and learning outcomes tracking
- **Staff Members**: Faculty and administration profiles with department categorization
- **Facilities**: Campus facilities with photo galleries and safety features
- **Footer Settings**: Dedicated footer content management with global settings integration

### Footer System with Global Settings Integration

The footer system has been redesigned to use global settings references instead of duplicating content:

**Global Settings Integration**:
- **Contact Information**: Footer references Site Settings contact info via `useGlobalContactInfo` flag
- **Social Media Links**: Footer uses Site Settings social media via `useGlobalSocialLinks` flag  
- **Prayer Times**: Footer displays Site Settings prayer times via `useGlobalPrayerTimes` flag

**Footer-Specific Content**:
- **Quick Links**: Navigation links specific to footer (About, Programs, Contact, etc.)
- **Legal Links**: Privacy policy, terms of service, and other legal pages
- **Copyright Text**: Multilingual copyright information
- **Title & Description**: Footer-specific branding and description text

**TypeScript Integration**:
- **Enhanced Types**: `FooterSettings` interface now includes centralized data types
- **Type Safety**: Proper typing for contact info, social links, and prayer times
- **Custom Icons**: Social media icons use custom SVG components instead of deprecated Lucide icons
- **Smart Fallbacks**: Graceful fallback to hardcoded data when CMS data is unavailable

**Benefits**:
- **Consistency**: Contact info, social links, and prayer times stay synchronized across the site
- **Maintainability**: Update contact information once in Site Settings, reflects everywhere
- **Flexibility**: Can still override with custom footer content by setting flags to false
- **Performance**: Reduces data duplication and query complexity
- **Type Safety**: Full TypeScript support with proper error handling

**Footer Query Structure**:
```typescript
// Footer query now uses boolean flags instead of duplicating data
const footerQuery = groq`
  *[_type == "footer" && isActive == true][0] {
    title { bengali, english },
    useGlobalContactInfo,    // References Site Settings
    useGlobalSocialLinks,    // References Site Settings  
    useGlobalPrayerTimes,    // References Site Settings
    quickLinks[] { ... },    // Footer-specific links
    legalLinks[] { ... },    // Footer-specific legal links
    copyright { bengali, english }
  }
`
```

**TypeScript Enhancements**:
```typescript
// Enhanced FooterSettings interface with centralized data support
export interface FooterSettings {
  // ... other fields
  contactInfo?: ContactInfo        // Populated from Site Settings
  socialLinks?: SocialMediaLink[]  // Populated from Site Settings
  prayerTimes?: PrayerTime[]      // Populated from Site Settings
}

// Smart contact info handling with proper typing
const contactInfo = {
  phone: footerSettings?.contactInfo?.phone?.find(p => p.isPrimary)?.number || 
         footerSettings?.contactInfo?.phone?.[0]?.number || 
         '+880 1234 567890',
  // ... other fields with proper fallbacks
};
```

### Usage Example

```typescript
import { client, previewClient, urlFor, getClient } from '@/lib/sanity';
import type { SiteSettings, ContactInfo, SocialMediaLink } from '@/types/sanity';

// Fetch published content using main client
const siteSettings: SiteSettings = await client.fetch('*[_type == "siteSettings"][0]');

// Access structured contact information
const primaryPhone = siteSettings.contactInfo?.phone?.find(p => p.isPrimary && p.isActive);
const admissionEmail = siteSettings.contactInfo?.email?.find(e => e.type === 'admission' && e.isActive);

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

// Access social media links with proper typing
const activeSocialLinks: SocialMediaLink[] = siteSettings.socialMedia?.filter(link => link.isActive) || [];
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

## Performance Optimization

The website is optimized for Bangladesh's internet infrastructure with comprehensive performance enhancements:

### Image Optimization
- **Next.js Image Component**: Automatic optimization with WebP and AVIF format support
- **Responsive Images**: Multiple device sizes (640px to 3840px) for optimal loading
- **Long-term Caching**: 1-year cache TTL for static images
- **Sanity CDN Integration**: Optimized image delivery with transformation support
- **SVG Support**: Safe SVG rendering with Content Security Policy

### Performance Features
- **SWC Minification**: Fast Rust-based JavaScript/TypeScript compilation
- **Compression**: Gzip/Brotli compression enabled for all assets
- **Bundle Optimization**: Tree-shaking and code splitting for minimal bundle sizes
- **Font Optimization**: Preloaded fonts with display swap for better loading experience
- **Lazy Loading**: Images and components load on demand

### Configuration
```typescript
// next.config.ts - Image optimization settings
images: {
  domains: ['cdn.sanity.io'],
  formats: ['image/webp', 'image/avif'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  minimumCacheTTL: 31536000, // 1 year
  dangerouslyAllowSVG: true,
  contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
}
```

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

## Homepage Components

### Hero Section

The homepage features a modern hero section (`src/components/homepage/hero-section.tsx`) with:

**Visual Design**:

- **Two-Column Grid Layout**: Full-width left content section with centered title and large image gallery, narrow right news sidebar
- **Clean White Background**: Professional white background for better content focus
- **Interactive Image Gallery**: Auto-rotating activity images with manual navigation indicators
- **Vertical News Sidebar**: Tall, narrow news feed with scrolling content and compact design

**Content Structure**:

- **Compact Title Section**: Streamlined institution info with smaller badge, optimized title sizing, and refined subtitle above the image gallery
- **Featured Image Gallery**: Large, prominent activity images (9/12 grid) with enhanced visual impact
- **News Sidebar**: Right column (3/12 grid) with vertical scrolling news feed
- **Centered CTA Buttons**: Action buttons positioned below the image gallery for better user flow
- **Multilingual Support**: Dynamic content using next-intl translations
- **Statistics Section**: Dedicated bottom section with four-column stats grid

**Dynamic Content Integration**:

- **Sanity CMS Integration**: Component now accepts `siteSettings` and `featuredNews` props for dynamic content
- **Site Settings**: Institution information, contact details, and statistics from Sanity CMS
- **Featured News**: Real-time news feed populated from Sanity's news and events content
- **Multilingual Content**: Uses `getLocalizedText` utility for proper Bengali/English content rendering
- **Type Safety**: Full TypeScript integration with Sanity content types

**Image Gallery System**:

- **Auto-Rotation**: Activity images cycle every 3 seconds with smooth fade transitions
- **Manual Navigation**: Interactive indicators allow users to jump to specific images
- **Activity Categories**: Classroom learning, Quran recitation, science lab, sports, and cultural programs
- **Image Overlays**: Title overlays with gradient backgrounds for better readability
- **Error Handling**: Fallback SVG placeholders for missing images

**News Feed System**:

- **Auto-Scrolling**: News items automatically scroll every 4 seconds
- **Date-Based Layout**: Each news item includes date box with day and month
- **Highlight System**: Featured news items with enhanced styling
- **Content Categories**: Admissions, achievements, events, examinations, and facility updates
- **Quick Access**: "View All" button for complete news section

**Layout Sections**:

- **Main Hero**: Two-column grid layout with centered title section above full-width gallery, plus news sidebar
- **Statistics Grid**: Four-column stats showcase with clean typography
- **Responsive Design**: Stacked layout on mobile, two-column on desktop with enhanced visual hierarchy

**Performance Features**:

- **Optimized Images**: Next.js Image component with proper error handling and fallbacks
- **Smooth Animations**: Staggered entrance animations with intersection observer
- **Efficient State Management**: Multiple useEffect hooks for different auto-rotation timers
- **Accessibility**: Proper alt texts, semantic HTML structure, and keyboard navigation

**Technical Implementation**:

- **Multiple State Management**: Separate state for image gallery, news feed, and visibility animations
- **TypeScript**: Fully typed interfaces for all data structures and component props
- **Tailwind CSS**: Utility-first styling with custom gradients and responsive grid system
- **Auto-Rotation Logic**: Independent timers for different content sections with proper cleanup
- **Enhanced Animations**: Smooth opacity and transform transitions for news items with directional movement
- **Improved Navigation**: Interactive dots for both image gallery and news feed sections

**Component Interface**:

```typescript
interface HeroSectionProps {
  className?: string;
  siteSettings?: SiteSettings | null;
  featuredNews?: NewsEvent[];
}
```

**Usage Example**:

```typescript
// In page component
const [siteSettings, featuredNews] = await Promise.all([
  contentService.getSiteSettings(),
  contentService.getFeaturedNewsEvents(3),
]);

// Render with dynamic content
<HeroSection 
  siteSettings={siteSettings}
  featuredNews={featuredNews}
/>
```

### Mission Statement and Statistics Section

The mission statement section (`src/components/homepage/mission-statistics-section.tsx`) provides:

**Content Integration**:

- **Dynamic Mission Statement**: Institution mission and vision from Sanity CMS
- **Statistics Display**: Key institutional metrics (students, teachers, years of service, success rate)
- **Multilingual Support**: Bengali and English content rendering with proper typography
- **Animated Counters**: Progressive number animation for statistical data

**Component Interface**:

```typescript
interface MissionStatisticsSectionProps {
  className?: string;
  siteSettings?: SiteSettings | null;
}
```

### Featured Content Section

The featured content section (`src/components/homepage/featured-content-section.tsx`) includes:

**Quick Access Navigation**:

- **Key Page Links**: Direct access to Admissions, Programs, and Contact pages with animated cards
- **Featured News Display**: Latest news and events from Sanity CMS with intelligent fallback system
- **Interactive Elements**: Hover effects, smooth transitions, and staggered animations
- **Call-to-Action Integration**: Strategic placement of enrollment and inquiry buttons

**Dynamic Content Integration**:

- **Sanity CMS Integration**: Component accepts `featuredNews` and `featuredFacilities` props for dynamic content
- **Intelligent Fallback System**: Automatically uses hardcoded content when CMS data is unavailable
- **Multilingual Support**: Proper Bengali/English content rendering with locale-aware formatting
- **Dynamic Image Handling**: Processes Sanity image assets with SVG fallback placeholders
- **Date Localization**: Proper date formatting based on selected language (Bengali: bn-BD, English: en-US)
- **SEO-Friendly URLs**: Generates localized URLs from Sanity slug data with proper fallback handling

**Enhanced Features**:

- **Intersection Observer**: Smooth scroll-triggered animations for better user experience
- **Image Preloading**: Performance optimization with hidden preload links
- **Error Handling**: Graceful SVG fallbacks for missing images
- **TypeScript Safety**: Full type checking with proper Sanity content type integration

**Component Interface**:

```typescript
interface FeaturedContentSectionProps {
  className?: string;
  featuredNews?: NewsEvent[];
  featuredFacilities?: Facility[];
}

// Usage with dynamic content
<FeaturedContentSection 
  featuredNews={featuredNews}
  featuredFacilities={featuredFacilities}
/>
```

**Technical Improvements**:

- **Fixed TypeScript Issues**: Resolved slug handling and data mapping inconsistencies
- **Performance Optimization**: Efficient content loading and image handling with lazy loading
- **Responsive Design**: Mobile-first approach with adaptive grid layouts
- **Animation System**: Staggered entrance animations with intersection observer
- **Accessibility**: Proper ARIA labels and semantic HTML structure

## About Page Components

The about page provides comprehensive institutional information through three main sections:

### School History and Vision

The history section (`src/components/about/school-history-vision.tsx`) features:

**Content Structure**:

- **Founding Story**: Institution's establishment in 1985 with Islamic educational philosophy
- **Mission Statement**: Integration of Islamic teachings with modern academic excellence
- **Vision Display**: Future goals and educational objectives
- **Quranic Integration**: Featured verses supporting educational mission

**Visual Design**:

- **Two-Column Layout**: Content and imagery side-by-side with responsive stacking
- **Islamic Aesthetics**: Geometric patterns and gradient overlays
- **Professional Typography**: Language-specific fonts with proper hierarchy
- **Image Optimization**: Fallback handling for missing images

### Leadership Team

The leadership section (`src/components/about/leadership-team.tsx`) includes:

**Team Organization**:

- **Department Grouping**: Administration, Islamic Studies, NCTB Curriculum, Co-curricular, Support Staff
- **Display Order**: Prioritized by department importance and individual ranking
- **Profile Cards**: Photo, name, position, and experience summary
- **Modal Profiles**: Detailed view with biography, qualifications, education, and specializations

**Interactive Features**:

- **Click-to-View**: Modal system for detailed staff information
- **Responsive Grid**: Adaptive layout from single column to four columns
- **Professional Styling**: Hover effects and smooth transitions
- **Accessibility**: Proper ARIA labels and keyboard navigation

**Data Integration**:

- **Sanity CMS**: Dynamic content from staff member schema
- **Multilingual Support**: Bengali and English content rendering
- **Image Handling**: Optimized photos with fallback avatars
- **Type Safety**: Full TypeScript integration with proper interfaces

### Educational Philosophy

The philosophy section (`src/components/about/educational-philosophy.tsx`) covers:

**Educational Integration**:

- **Islamic-Modern Balance**: Combination of Quranic teachings with NCTB curriculum
- **Subject Coverage**: Comprehensive academic program overview
- **Teaching Methodology**: Explanation of integrated educational approach
- **Student Development**: Holistic growth philosophy

**Accreditation Display**:

- **Government Recognition**: Ministry of Education approval certificates
- **Board Certifications**: Madrasah Education Board and NCTB recognition
- **Certificate Modals**: Full-screen certificate viewing system
- **Trust Indicators**: Experience, recognition, success rates, and standards

**Technical Features**:

- **Modal System**: Certificate viewing with image optimization
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Content Management**: Optional Sanity CMS integration for dynamic content
- **Fallback Content**: Default content when CMS data is unavailable

## Admissions Page

The admissions page (`/admissions`) provides comprehensive information for prospective students and parents, featuring three main sections that guide families through the enrollment process.

### Requirements and Application Process

The requirements section (`src/components/admissions/requirements-section.tsx`) includes:

**Admission Requirements Display**:

- **Academic Requirements**: Grade-specific academic criteria with clear prerequisites
- **Islamic Knowledge Requirements**: Religious education background and Quranic knowledge expectations
- **Visual Organization**: Color-coded requirement categories with checkmark indicators
- **Multilingual Support**: Full Bengali and English content rendering

**Step-by-Step Application Process**:

- **Interactive Progress Indicator**: Visual step tracker with clickable navigation
- **Detailed Step Information**: Comprehensive guidance for each application phase
- **Document Requirements**: Complete checklist of required documents with visual indicators
- **Downloadable Forms**: PDF application forms with file size information and direct download links

**Key Features**:

- **Heroicons Integration**: Professional icons for visual enhancement
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Interactive Elements**: Clickable progress steps and hover effects
- **Document Management**: Organized form downloads with size indicators

### Fee Structure and Financial Information

The fee structure section (`src/components/admissions/fee-structure-section.tsx`) provides:

**Comprehensive Fee Display**:

- **Program-based Fee Tables**: Detailed breakdown by academic level (Primary, Secondary, Higher)
- **Interactive Program Selector**: Dynamic switching between different program fee structures
- **Transparent Pricing**: Clear display of admission fees, monthly tuition, exam fees, and development costs
- **Currency Formatting**: Proper Bengali Taka (৳) formatting with number localization

**Financial Aid Calculator**:

- **Interactive Calculator**: Real-time fee estimation based on selected criteria
- **Sibling Discounts**: Automatic calculation for multiple children enrollment
- **Scholarship Integration**: Merit and need-based scholarship consideration
- **Visual Results**: Prominent display of estimated costs with explanatory notes

**Scholarship Information**:

- **Multiple Scholarship Types**: Merit-based, need-based, sibling, and orphan scholarships
- **Discount Percentages**: Clear display of available financial assistance amounts
- **Eligibility Criteria**: Detailed requirements for each scholarship category
- **Visual Organization**: Color-coded scholarship cards with percentage badges

**Payment Methods and Policies**:

- **Multiple Payment Options**: Bank transfer, mobile banking, and cash payment methods
- **Payment Details**: Account information and transaction procedures
- **Policy Guidelines**: Clear payment deadlines and refund policies
- **Security Information**: Safe payment practices and verification procedures

### Important Dates and Inquiry System

The important dates section (`src/components/admissions/important-dates-section.tsx`) features:

**Academic Calendar Display**:

- **Timeline Visualization**: Chronological display of admission milestones
- **Date Categorization**: Color-coded event types (applications, deadlines, exams, interviews)
- **Status Indicators**: Visual distinction between upcoming and past dates
- **Detailed Descriptions**: Comprehensive information for each important date

**Interactive Inquiry Form**:

- **Comprehensive Form Fields**: Contact information, student details, and inquiry specifics
- **Form Validation**: Real-time validation with required field indicators
- **Subject Categorization**: Dropdown options for different inquiry types
- **Submission Handling**: Loading states, success confirmation, and error handling
- **Form Reset**: Automatic form clearing after successful submission

**FAQ Section**:

- **Expandable Questions**: Collapsible FAQ items with smooth animations
- **Common Inquiries**: Frequently asked questions about admissions process
- **Search-friendly Content**: Well-organized Q&A format for easy navigation
- **Interactive Elements**: Click-to-expand functionality with visual indicators

**Technical Features**:

- **State Management**: Complex form state handling with TypeScript interfaces
- **Date Formatting**: Proper date localization and formatting
- **Accessibility**: ARIA labels, keyboard navigation, and semantic HTML
- **Performance**: Efficient rendering with conditional displays and animations

## Academic Programs Page

The academic programs page (`/programs`) provides comprehensive curriculum information through three specialized sections, showcasing the institution's integrated educational approach.

### Islamic Studies Section

The Islamic Studies section (`src/components/programs/islamic-studies-section.tsx`) features:

**Curriculum Display**:

- **Subject Organization**: Quran memorization, Hadith studies, Fiqh (Islamic jurisprudence), and Arabic language
- **Expandable Content**: Collapsible program and subject sections for detailed exploration
- **Arabic Text Integration**: Proper rendering of Quranic verses and Arabic terminology with right-to-left support
- **Visual Indicators**: Islamic symbols and color-coded subject categories

**Interactive Features**:

- **Multi-level Expansion**: Programs expand to show subjects, subjects expand to show detailed descriptions
- **Prerequisites Display**: Entry requirements and recommended background knowledge
- **Learning Outcomes**: Clear educational objectives and expected achievements
- **Hours Tracking**: Weekly hour allocation for each subject

**Content Integration**:

- **Quranic Verses**: Contextual Islamic references with Arabic text and translations
- **Subject-specific Content**: Tailored information based on subject type (Quran, Hadith, Fiqh, Arabic)
- **Multilingual Support**: Full Bengali and English content rendering
- **Typography**: Specialized Arabic font (Amiri) for proper Islamic text display

### NCTB Curriculum Section

The NCTB Curriculum section (`src/components/programs/nctb-curriculum-section.tsx`) includes:

**Advanced Filtering System**:

- **Search Functionality**: Real-time search across subjects and programs
- **Grade Level Filters**: Primary (1-5) and Secondary (6-10) grade filtering
- **Subject Categories**: Color-coded subjects (Mathematics, Science, English, Bengali, Social Studies)
- **Combined Filtering**: Search and grade filters work together for precise results

**Curriculum Integration Display**:

- **Subject Breakdown**: Detailed NCTB subject information with descriptions
- **Integration Points**: Clear explanation of how Islamic values are incorporated into secular subjects
- **Subject-specific Examples**: Practical examples of Islamic integration (Zakat in Math, Creation in Science)
- **Visual Categorization**: Color-coded subject cards for easy identification

**Educational Philosophy Integration**:

- **Balanced Approach**: Demonstration of Islamic-modern education balance
- **Integration Examples**: Specific examples for different subject categories
- **Teaching Methodology**: Explanation of how subjects are taught with Islamic perspective
- **Academic Standards**: Alignment with national curriculum requirements

### Co-curricular Activities Section

The Co-curricular Activities section (`src/components/programs/co-curricular-section.tsx`) provides:

**Activity Organization**:

- **Category-based Filtering**: Islamic competitions, cultural programs, sports, academic competitions, community service
- **Visual Categories**: Emoji icons and color-coded categories for easy navigation
- **Activity Details**: Comprehensive descriptions with age ranges and program associations
- **Interactive Expansion**: Click-to-expand activity details with smooth animations

**Category-specific Content**:

- **Islamic Competitions**: Quranic verses and Islamic context for religious competitions
- **Community Service**: Hadith references emphasizing social responsibility
- **Sports Activities**: Character building through physical fitness and teamwork
- **Cultural Programs**: Islamic culture and tradition preservation
- **Academic Competitions**: Intellectual development and academic excellence

**Technical Features**:

- **Dynamic Filtering**: Real-time category filtering with activity count display
- **Cross-program Integration**: Activities from multiple programs displayed together
- **Responsive Grid**: Adaptive layout for different screen sizes
- **Empty State Handling**: User-friendly messages when no activities match filters

### Page-level Features

**Unified Design System**:

- **Consistent Styling**: Shared design patterns across all three sections
- **Islamic Aesthetics**: Gradient backgrounds, geometric patterns, and Islamic color scheme
- **Typography Hierarchy**: Clear information architecture with proper heading levels
- **Responsive Layout**: Mobile-first design with desktop enhancements

**Performance Optimization**:

- **Efficient State Management**: Optimized React state for multiple expandable sections
- **Smooth Animations**: CSS transitions for expand/collapse interactions
- **Image Optimization**: Next.js Image component integration where applicable
- **Accessibility**: ARIA labels, keyboard navigation, and semantic HTML structure

**Content Management Integration**:

- **Sanity CMS**: Full integration with academic program content types
- **Multilingual Content**: Dynamic language switching for all program content
- **Type Safety**: Comprehensive TypeScript interfaces for all data structures
- **Error Handling**: Graceful fallbacks for missing or incomplete data

## Campus and Facilities Page

The campus and facilities page (`/campus`) provides a comprehensive virtual tour and detailed information about the institution's facilities, safety measures, and security protocols.

**Component Architecture**:
- **Virtual Tour Section**: Dynamic CMS integration with intelligent fallback to curated gallery images
- **Facilities Showcase**: Dynamic content integration with Sanity CMS for real-time facility information
- **Safety Section**: Static content with institutional safety policies and procedures

**CMS Integration**:
- Both Virtual Tour and Facilities Showcase components now integrate with Sanity CMS
- Facilities data is fetched from Sanity and passed to both components for consistent content
- Automatic fallback to hardcoded data ensures reliability when CMS is unavailable
- Multilingual content support with proper locale-aware rendering

### Virtual Campus Tour Section

The virtual tour section (`src/components/campus/virtual-tour-section.tsx`) features:

**Dynamic Content Integration**:
- **Sanity CMS Integration**: Component accepts `facilities` prop for dynamic content from Sanity CMS
- **Intelligent Fallback System**: Automatically uses hardcoded gallery when CMS data is unavailable
- **Multilingual Support**: Proper Bengali/English content rendering with locale-aware text
- **Dynamic Image Processing**: Converts Sanity facility data to gallery format with optimized images
- **Type Safety**: Full TypeScript integration with Sanity content types

**Component Interface**:
```typescript
interface VirtualTourSectionProps {
  facilities?: Facility[];
}

// Usage with dynamic content
<VirtualTourSection facilities={facilities} />
```

**Interactive Image Gallery**:

- **Category-based Filtering**: Academic, Islamic, recreational, and administrative facility categories
- **Lightbox Functionality**: Full-screen image viewing with keyboard navigation support
- **Image Metadata**: Detailed descriptions, titles, and facility information for each image
- **Responsive Grid Layout**: Adaptive layout from single column to four columns based on screen size

**Advanced User Experience**:

- **Keyboard Navigation**: Arrow keys for image navigation, Escape key to close lightbox
- **Smooth Animations**: Hover effects, image scaling, and transition animations
- **Touch-friendly Interface**: Optimized for mobile devices with touch interactions
- **Accessibility Features**: Proper ARIA labels, semantic HTML, and keyboard navigation support

**Technical Features**:

- **Body Scroll Lock**: Prevents background scrolling when lightbox is open
- **Image Optimization**: Next.js Image component with proper sizing and lazy loading
- **State Management**: Complex state handling for gallery, lightbox, and category filtering
- **Performance Optimized**: Efficient rendering with conditional displays and cleanup

### Facilities Showcase Section

The facilities showcase section (`src/components/campus/facilities-showcase.tsx`) includes:

**Dynamic Content Integration**:
- Accepts facilities data from Sanity CMS as props
- Intelligent fallback to hardcoded data when CMS content unavailable
- Real-time content updates through CMS integration

**Comprehensive Facility Display**:

- **Dual Category System**: Islamic facilities and modern amenities with separate showcases
- **Advanced Search and Filtering**: Real-time search across facility names, descriptions, and features
- **Detailed Facility Cards**: Images, descriptions, capacity information, and feature lists
- **Category-based Organization**: Islamic, academic, recreational, administrative, and medical facilities

**Interactive Features**:

- **Real-time Search**: Instant filtering based on facility names, descriptions, and features
- **Multi-level Filtering**: Category filters with facility counts and combined search functionality
- **Responsive Cards**: Hover effects, image scaling, and detailed feature displays
- **Capacity Indicators**: Visual display of facility capacity and usage information

**Content Organization**:

- **Feature Highlighting**: Key facility features with visual badges and indicators
- **Modern vs Traditional**: Clear distinction between Islamic facilities and modern amenities
- **Visual Categories**: Color-coded facility types with appropriate icons and styling
- **Empty State Handling**: User-friendly messages when no facilities match search criteria

### Safety and Security Section

The safety and security section (`src/components/campus/safety-security-section.tsx`) provides:

**Comprehensive Safety Information**:

- **Safety Measures Grid**: Four main categories - security systems, medical facilities, emergency protocols, and child protection
- **Detailed Feature Lists**: Specific safety features and capabilities for each measure
- **Visual Indicators**: Icons and color coding for different types of safety measures
- **Trust Building Elements**: Statistics and certifications to build parent confidence

**Policy Documentation**:

- **Student Welfare Policies**: Comprehensive guidelines for student well-being and development
- **Campus Safety Protocols**: Detailed safety procedures and security measures
- **Digital Safety Guidelines**: Technology use policies and privacy protection measures
- **Emergency Procedures**: Step-by-step emergency response protocols

**Emergency Contact System**:

- **24/7 Contact Information**: Multiple emergency contact numbers with availability indicators
- **Role-specific Contacts**: Principal, medical, security, and general emergency contacts
- **Click-to-call Functionality**: Direct phone links for immediate contact
- **Response Time Indicators**: Clear information about availability and response times

**Trust and Credibility Indicators**:

- **Security Statistics**: 24/7 monitoring, staff background checks, response times
- **Safety Record**: Years of incident-free operation and safety achievements
- **Certification Display**: Safety certifications and compliance indicators
- **Parent Communication**: Clear communication channels and notification procedures

### Page-level Features

**Unified Design System**:

- **Consistent Styling**: Shared design patterns across all three campus sections
- **Islamic-Modern Balance**: Visual representation of both traditional and contemporary facilities
- **Responsive Layout**: Mobile-first design with desktop enhancements
- **Performance Optimization**: Efficient image loading and state management

**Content Management Integration**:

- **Dynamic Facility Data**: Both Virtual Tour and Facilities Showcase components receive facility data from Sanity CMS
- **Consistent Content**: Same facility data used across multiple components for content consistency
- **Fallback Reliability**: Automatic fallback to hardcoded data when CMS is unavailable
- **Multilingual Support**: Proper locale-aware content rendering throughout all components
- **Type Safety**: Comprehensive TypeScript interfaces for all data structures

### Campus Page Implementation

The campus page route (`src/app/[locale]/campus/page.tsx`) demonstrates full CMS integration:

**Data Fetching**:
```typescript
export default async function CampusPage() {
  const draft = await draftMode();
  const isPreview = draft.isEnabled;
  const contentService = getContentService(isPreview);
  
  // Fetch facilities data from Sanity
  const facilities = await contentService.getAllFacilities();

  return (
    <main>
      {/* Pass facilities to both components */}
      <VirtualTourSection facilities={facilities} />
      <FacilitiesShowcase facilities={facilities} />
      <SafetySecuritySection />
    </main>
  );
}
```

**Key Features**:
- **Preview Mode Support**: Automatic draft content loading for content editors
- **Shared Data**: Single facility fetch shared across multiple components
- **SEO Optimization**: Dynamic metadata generation with internationalization
- **Error Handling**: Graceful fallback when CMS data is unavailable

**Technical Implementation**:

- **Advanced State Management**: Complex filtering, search, and gallery state handling
- **Image Optimization**: Next.js Image component with proper sizing and formats
- **Accessibility Compliance**: ARIA labels, keyboard navigation, and semantic HTML
- **Performance Features**: Lazy loading, efficient rendering, and smooth animations

## News and Events Page

The news and events page (`/news`) provides comprehensive coverage of school activities, achievements, and upcoming events through a modern, interactive interface with multiple viewing modes.

### Main Features

The news and events page (`src/components/news-events/news-events-page.tsx`) includes:

**Multi-Tab Interface**:
- **News List View**: Grid-based display of all news articles and events with filtering and search
- **Events Calendar**: Calendar view for upcoming events with date-based navigation
- **Photo Gallery**: Visual showcase of event photos and media with slideshow functionality

**Advanced Filtering System**:
- **Category Filtering**: Filter by achievements, news, events, and announcements
- **Real-time Search**: Instant search across titles and content in both languages
- **Combined Filtering**: Search and category filters work together for precise results
- **Dynamic Results**: Live updating of results with smooth transitions

**Responsive Design**:
- **Mobile-first Approach**: Optimized for mobile devices with touch-friendly interactions
- **Adaptive Layouts**: Grid layouts adjust from single column to three columns based on screen size
- **Tab Navigation**: Horizontal tab system with active state indicators
- **Loading States**: Professional loading animations and skeleton screens

### News Card Component

The news card component (`src/components/news-events/news-card.tsx`) features:

**Visual Design**:
- **Featured Images**: Optimized images with fallback handling and aspect ratio preservation
- **Category Badges**: Color-coded category indicators for quick identification
- **Date Display**: Formatted publication dates with proper localization
- **Hover Effects**: Smooth transitions and interactive states for better user experience

**Content Structure**:
- **Multilingual Titles**: Dynamic title display based on selected language
- **Excerpt Preview**: Brief content preview with proper text truncation
- **Read More Links**: Navigation to full article pages with smooth transitions
- **Event Dates**: Special handling for events with date and time information

### Events Calendar

The events calendar component (`src/components/news-events/events-calendar.tsx`) provides:

**Calendar Functionality**:
- **Monthly View**: Full calendar display with event indicators on relevant dates
- **Event Details**: Click-to-view event information with modal or expanded view
- **Navigation Controls**: Month/year navigation with smooth transitions
- **Event Filtering**: Filter events by category within the calendar view

**Event Integration**:
- **Date Highlighting**: Visual indicators for dates with scheduled events
- **Multiple Events**: Support for multiple events on the same date
- **Event Categories**: Color-coded events based on category type
- **Responsive Layout**: Mobile-optimized calendar with touch navigation

### Photo Gallery System

The photo gallery components provide comprehensive media display:

#### Media Slideshow (`src/components/news-events/media-slideshow.tsx`)

**Featured Content Display**:
- **Auto-rotating Slideshow**: Featured event photos with automatic progression
- **Manual Navigation**: Arrow controls and dot indicators for user control
- **Full-screen Mode**: Lightbox functionality for detailed image viewing
- **Caption Support**: Image captions and descriptions with proper typography

#### Photo Gallery (`src/components/news-events/photo-gallery.tsx`)

**Comprehensive Gallery**:
- **Grid Layout**: Responsive photo grid with masonry-style arrangement
- **Category Filtering**: Filter photos by event type or category
- **Lightbox Integration**: Full-screen photo viewing with keyboard navigation
- **Lazy Loading**: Performance-optimized image loading with intersection observer

### Search and Filter Components

#### Search Bar (`src/components/news-events/search-bar.tsx`)

**Advanced Search**:
- **Real-time Results**: Instant search results as user types
- **Multilingual Search**: Search across both Bengali and English content
- **Search Highlighting**: Visual indication of search terms in results
- **Clear Functionality**: Easy search reset with clear button

#### News Filters (`src/components/news-events/news-filters.tsx`)

**Category Management**:
- **Visual Filter Buttons**: Color-coded category buttons with active states
- **Result Counts**: Display number of items in each category
- **All Categories**: Option to view all content without filtering
- **Smooth Transitions**: Animated filter changes with loading states

### Individual Article Pages

The news article page component (`src/components/news-events/news-article-page.tsx`) provides:

**Full Article Display**:
- **Rich Content Rendering**: Full article content with proper typography and formatting
- **Featured Images**: Large hero images with caption support
- **Social Sharing**: Integration with social media sharing capabilities
- **Related Articles**: Suggestions for similar or related content

**Interactive Features**:
- **Photo Galleries**: Embedded photo galleries within articles
- **Event RSVP**: Registration functionality for events with form handling
- **Print Friendly**: Optimized layouts for printing and PDF generation
- **Navigation**: Previous/next article navigation with smooth transitions

### Event RSVP System

The event RSVP component (`src/components/news-events/event-rsvp.tsx`) includes:

**Registration Functionality**:
- **Form Validation**: Comprehensive form validation with error handling
- **Confirmation System**: Email confirmations and registration tracking
- **Capacity Management**: Event capacity tracking and waitlist functionality
- **User Experience**: Loading states, success messages, and error handling

### Data Management

**Sanity CMS Integration**:
- **Dynamic Content**: All news and events content managed through Sanity CMS
- **Multilingual Support**: Full Bengali and English content management
- **Image Optimization**: Sanity's image pipeline for responsive images
- **Preview Mode**: Content preview functionality for editors

**Query System** (`src/lib/queries/news-events.ts`):
- **Optimized Queries**: Efficient GROQ queries for different content needs
- **Category Filtering**: Server-side filtering by category and date
- **Search Functionality**: Full-text search across multilingual content

## Contact and Location Page

The contact page (`/contact`) provides comprehensive contact information, location details, and inquiry forms to facilitate communication between the school and prospective families, current students, and the community.

### Contact Information Display

The contact information component (`src/components/contact/contact-info-display.tsx`) features:

**Primary Contact Cards**:
- **Main Office**: Complete contact details with phone, email, hours, and address
- **Admission Office**: Dedicated admission contact information with extended hours
- **Principal's Office**: Direct access to school leadership with specific availability
- **Click-to-Contact**: Interactive phone and email links for immediate communication

**Department Directory**:
- **Academic Affairs**: Contact information for curriculum and academic matters
- **Islamic Studies Department**: Specialized contact for religious education inquiries
- **Student Affairs**: Student support services and welfare contacts
- **Finance Office**: Fee payment and financial assistance inquiries

**Emergency Contacts**:
- **24/7 Campus Security**: Round-the-clock security contact information
- **Medical Emergency**: On-campus medical support during school hours
- **Principal Emergency Line**: After-hours emergency contact for urgent matters
- **Visual Hierarchy**: Color-coded emergency section with prominent display

### Location and Maps Integration

The location maps component (`src/components/contact/location-maps.tsx`) provides:

**Interactive Mapping**:
- **Google Maps Integration**: Embedded interactive map with school location
- **Direction Services**: Direct integration with Google Maps for turn-by-turn directions
- **Printable Directions**: Print-friendly direction guide for offline use
- **External Map Links**: Quick access to Google Maps app for mobile users

**Location Information**:
- **Complete Address**: Full postal address with proper formatting
- **Nearby Landmarks**: Key landmarks for easy navigation and reference
- **Public Transportation**: Detailed bus routes, stops, and transportation options
- **Parking Information**: On-campus parking availability and restrictions

**Transportation Guide**:
- **Bus Routes**: Specific bus numbers and stops serving the school area
- **Ride Sharing**: Uber, Pathao, and local ride-sharing service information
- **Auto-rickshaw/CNG**: Local transportation options with pickup points
- **Travel Times**: Estimated travel times from major locations in Dhaka

**Directional Information**:
- **From Airport**: Detailed directions from Hazrat Shahjalal International Airport
- **From Railway Station**: Route guidance from Kamalapur Railway Station
- **From Bus Terminal**: Directions from major bus terminals including Gabtali
- **Time Estimates**: Realistic travel time estimates for different transportation modes

### Contact Forms System

The contact forms component (`src/components/contact/contact-forms.tsx`) includes:

**Multi-Form Interface**:
- **Form Type Selection**: Choose between General Inquiry, Admission Inquiry, and Feedback forms
- **Visual Form Selector**: Icon-based form type selection with descriptions
- **Dynamic Form Content**: Form fields and validation adapt based on selected type
- **Smooth Transitions**: Animated transitions between different form types

**Comprehensive Form Fields**:
- **Personal Information**: Name, email, and phone number with validation
- **Inquiry Categorization**: Dropdown selection for inquiry type and subject
- **Message Composition**: Rich text area for detailed inquiries and feedback
- **Required Field Validation**: Real-time validation with clear error messages

**Advanced Features**:
- **Spam Protection**: Honeypot field implementation for automated spam prevention
- **Form Validation**: Client-side validation with comprehensive error handling
- **Submission States**: Loading indicators, success confirmations, and error messages
- **Form Reset**: Automatic form clearing after successful submission

**User Experience**:
- **Responsive Design**: Mobile-optimized forms with touch-friendly inputs
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support
- **Visual Feedback**: Clear success and error states with appropriate messaging
- **Multi-language Support**: Full Bengali and English form labels and messages

### Page Integration

**Route Implementation**:
- **Next.js App Router**: Proper route structure at `/[locale]/contact`
- **Metadata Generation**: Dynamic SEO metadata with language-specific titles and descriptions
- **TypeScript Integration**: Full type safety with proper interface definitions
- **Internationalization**: Complete i18n support with next-intl integration

**Component Architecture**:
- **Modular Design**: Separate components for different page sections
- **Reusable Components**: Contact cards and form elements designed for reusability
- **State Management**: Efficient React state handling for form interactions
- **Performance Optimization**: Lazy loading and efficient rendering patterns

**SEO and Accessibility**:
- **Structured Data**: Proper schema markup for contact information
- **Meta Tags**: Comprehensive meta tags for social sharing and search engines
- **Semantic HTML**: Proper HTML structure for accessibility and SEO
- **Mobile Optimization**: Mobile-first responsive design with touch interactions
- **Performance**: Cached queries and optimized data fetching

**Content Types**:
- **News Articles**: General news and announcements with rich content
- **Events**: Scheduled events with date, time, and RSVP functionality
- **Achievements**: Student and institutional achievements with photo galleries
- **Announcements**: Important notices and updates for the community

### Technical Features

**Performance Optimization**:
- **Lazy Loading**: Images and content load as needed for better performance
- **Efficient State Management**: Optimized React state for complex filtering and search
- **Smooth Animations**: CSS transitions and transforms for all interactions
- **Error Boundaries**: Graceful error handling with user-friendly messages

**Accessibility**:
- **Keyboard Navigation**: Full keyboard support for all interactive elements
- **Screen Reader Support**: Proper ARIA labels and semantic HTML structure
- **Focus Management**: Logical focus flow and visual focus indicators
- **Color Contrast**: High contrast ratios for better readability

**SEO and Social**:
- **Meta Tags**: Dynamic meta tags for individual articles and events
- **Open Graph**: Social media sharing optimization with proper images and descriptions
- **Structured Data**: Schema markup for events and articles
- **Sitemap Integration**: Automatic inclusion in XML sitemap

## Rich Text Component

The website includes a comprehensive rich text renderer (`src/components/ui/rich-text.tsx`) for displaying Sanity Portable Text content:

### Features

- **Portable Text Support**: Full integration with Sanity's Portable Text format
- **Multilingual Typography**: Automatic font selection based on language (Bengali/English)
- **Rich Formatting**: Support for headings, paragraphs, blockquotes, links, and emphasis
- **Image Rendering**: Optimized image display with Next.js Image component and responsive sizing
- **Semantic HTML**: Proper heading hierarchy and accessible markup
- **Custom Styling**: Islamic-inspired design with primary color scheme integration

### Usage

```typescript
import { RichText } from '@/components/ui/rich-text';

// Basic usage
<RichText content={portableTextContent} />

// With language-specific typography
<RichText
  content={portableTextContent}
  language="bengali"
  className="custom-styles"
/>
```

### Supported Content Types

- **Text Blocks**: Paragraphs, headings (H1-H3), blockquotes
- **Inline Formatting**: Bold, italic, and linked text
- **Images**: Responsive images with alt text and captions
- **Links**: Internal and external links with proper security attributes

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
