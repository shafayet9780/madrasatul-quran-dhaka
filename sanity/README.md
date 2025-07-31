# Sanity CMS Configuration for Madrasatul Quran Website

This directory contains the Sanity CMS configuration for the Madrasatul Quran website, including schemas, custom components, and studio configuration.

## Structure

```
sanity/
├── components/          # Custom Sanity Studio components
│   ├── PreviewComponent.tsx    # Custom preview components
│   └── StudioLogo.tsx         # Custom studio logo
├── schemas/            # Content type schemas
│   ├── index.ts               # Schema exports
│   ├── page.ts               # Page content schema
│   ├── newsEvent.ts          # News & events schema
│   ├── academicProgram.ts    # Academic programs schema
│   ├── staffMember.ts        # Staff member schema
│   ├── facility.ts           # Facility schema
│   └── siteSettings.ts       # Site settings schema
├── structure.ts        # Custom studio structure
└── README.md          # This file
```

## Content Types

### 1. Site Settings (Singleton)
Global site configuration including:
- Site title and description (multilingual)
- Logo and favicon
- Contact information
- Social media links
- SEO settings
- School statistics

### 2. Pages
Static pages with:
- Multilingual title and content
- SEO metadata
- Featured images
- Rich text content with images

### 3. News & Events
Dynamic content including:
- News articles
- Event announcements
- Student achievements
- Photo galleries
- Category filtering

### 4. Academic Programs
Educational program information:
- Islamic studies curriculum
- NCTB curriculum details
- Co-curricular activities
- Age-wise program structure
- Learning outcomes

### 5. Staff Members
Faculty and staff profiles:
- Personal information
- Qualifications and experience
- Department categorization
- Leadership team designation
- Professional photos

### 6. Facilities
Campus facilities showcase:
- Facility descriptions and images
- Category-based organization
- Capacity and specifications
- Safety features
- Usage schedules

## Multilingual Support

All content types support Bengali and English languages with:
- Separate fields for each language
- Fallback mechanisms
- Language-specific slugs
- Proper typography support

## Image Optimization

Images are configured with:
- Hotspot support for cropping
- Alt text requirements
- Responsive image generation
- WebP format support
- Lazy loading optimization

## Studio Features

### Custom Structure
- Organized content navigation
- Category-based filtering
- Featured content sections
- Department-wise staff organization

### Preview Components
- Multilingual content preview
- Status indicators
- Category badges
- Rich media previews

### Validation
- Required field validation
- Character limits for SEO
- Image alt text requirements
- Email format validation

## Development Commands

```bash
# Start Sanity Studio in development mode
npm run sanity

# Build Sanity Studio for production
npm run sanity:build

# Deploy Sanity Studio
npm run sanity:deploy
```

## Environment Variables

Required environment variables:
```
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your_api_token
```

## Content Management Workflow

1. **Site Settings**: Configure global site information first
2. **Pages**: Create static pages (About, Contact, etc.)
3. **Academic Programs**: Set up educational program details
4. **Staff**: Add faculty and staff information
5. **Facilities**: Showcase campus facilities
6. **News & Events**: Regularly update with fresh content

## Best Practices

### Content Creation
- Always fill both Bengali and English fields
- Use descriptive alt text for all images
- Keep meta descriptions under 160 characters
- Use consistent formatting across content

### Image Guidelines
- Use high-quality images (minimum 1200px width)
- Follow Islamic modesty guidelines for photos
- Optimize images before upload
- Include descriptive captions

### SEO Optimization
- Write unique meta titles and descriptions
- Use relevant keywords naturally
- Structure content with proper headings
- Include local SEO elements for Dhaka

### Performance
- Limit image file sizes
- Use appropriate image formats
- Minimize rich text content length
- Regular content audits

## Troubleshooting

### Common Issues

1. **Schema Validation Errors**
   - Check required fields are filled
   - Verify field types match schema
   - Ensure proper multilingual structure

2. **Image Upload Issues**
   - Check file size limits
   - Verify image format support
   - Ensure proper alt text

3. **Preview Not Working**
   - Verify environment variables
   - Check API token permissions
   - Confirm dataset configuration

### Support

For technical issues:
1. Check Sanity documentation
2. Verify environment configuration
3. Review schema definitions
4. Test with minimal content

## Security

- API tokens are environment-specific
- Content is validated before publishing
- Image uploads are scanned
- User permissions are role-based