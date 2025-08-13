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
│   ├── homepage/          # Homepage-specific components
│   │   └── hero-section.tsx # Hero section with background image and CTAs
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
│   ├── ui/                # Reusable UI components
│   │   └── rich-text.tsx  # Rich text renderer for Sanity Portable Text
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
- **Academic Programs**: Comprehensive curriculum management with:
  - Islamic Studies curriculum (Quran, Hadith, Fiqh, Arabic)
  - NCTB curriculum integration with subject-wise breakdown
  - Co-curricular activities with category-based organization
  - Prerequisites and learning outcomes tracking
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
