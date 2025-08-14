import type {
  MultilingualText,
  MultilingualSlug,
  SanityImage,
  Page,
  NewsEvent,
  AcademicProgram,
  StaffMember,
  Facility,
  SiteSettings
} from '@/types/sanity';

/**
 * Content validation utilities for Sanity CMS content
 */

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Validate multilingual text fields
 */
export function validateMultilingualText(
  text: MultilingualText | undefined,
  fieldName: string,
  required = true
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!text) {
    if (required) {
      errors.push({
        field: fieldName,
        message: `${fieldName} is required`,
        severity: 'error'
      });
    }
    return errors;
  }

  if (required && (!text.bengali || !text.english)) {
    if (!text.bengali) {
      errors.push({
        field: `${fieldName}.bengali`,
        message: `Bengali translation for ${fieldName} is required`,
        severity: 'error'
      });
    }
    if (!text.english) {
      errors.push({
        field: `${fieldName}.english`,
        message: `English translation for ${fieldName} is required`,
        severity: 'error'
      });
    }
  }

  // Check for content length consistency
  if (text.bengali && text.english) {
    const bengaliLength = text.bengali.length;
    const englishLength = text.english.length;
    const lengthDifference = Math.abs(bengaliLength - englishLength);
    const averageLength = (bengaliLength + englishLength) / 2;

    // Warn if translations differ significantly in length (more than 50% difference)
    if (lengthDifference > averageLength * 0.5 && averageLength > 50) {
      errors.push({
        field: fieldName,
        message: `Translation lengths differ significantly (Bengali: ${bengaliLength}, English: ${englishLength})`,
        severity: 'warning'
      });
    }
  }

  return errors;
}

/**
 * Validate multilingual slug fields
 */
export function validateMultilingualSlug(
  slug: MultilingualSlug | undefined,
  fieldName: string,
  required = true
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!slug) {
    if (required) {
      errors.push({
        field: fieldName,
        message: `${fieldName} is required`,
        severity: 'error'
      });
    }
    return errors;
  }

  if (required && (!slug.bengali?.current || !slug.english?.current)) {
    if (!slug.bengali?.current) {
      errors.push({
        field: `${fieldName}.bengali`,
        message: `Bengali slug for ${fieldName} is required`,
        severity: 'error'
      });
    }
    if (!slug.english?.current) {
      errors.push({
        field: `${fieldName}.english`,
        message: `English slug for ${fieldName} is required`,
        severity: 'error'
      });
    }
  }

  // Validate slug format
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  
  if (slug.bengali?.current && !slugPattern.test(slug.bengali.current)) {
    errors.push({
      field: `${fieldName}.bengali`,
      message: 'Bengali slug must contain only lowercase letters, numbers, and hyphens',
      severity: 'error'
    });
  }

  if (slug.english?.current && !slugPattern.test(slug.english.current)) {
    errors.push({
      field: `${fieldName}.english`,
      message: 'English slug must contain only lowercase letters, numbers, and hyphens',
      severity: 'error'
    });
  }

  return errors;
}

/**
 * Validate Sanity image fields
 */
export function validateSanityImage(
  image: SanityImage | undefined,
  fieldName: string,
  required = true
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!image) {
    if (required) {
      errors.push({
        field: fieldName,
        message: `${fieldName} is required`,
        severity: 'error'
      });
    }
    return errors;
  }

  if (!image.asset?._ref) {
    errors.push({
      field: `${fieldName}.asset`,
      message: `Image asset reference is missing for ${fieldName}`,
      severity: 'error'
    });
  }

  if (!image.alt) {
    errors.push({
      field: `${fieldName}.alt`,
      message: `Alt text is required for ${fieldName}`,
      severity: 'error'
    });
  }

  return errors;
}

/**
 * Validate Page content
 */
export function validatePage(page: Page): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate required fields
  errors.push(...validateMultilingualText(page.title, 'title', true));
  errors.push(...validateMultilingualSlug(page.slug, 'slug', true));
  
  // Validate content
  if (!page.content?.bengali || !page.content?.english) {
    errors.push({
      field: 'content',
      message: 'Content is required in both languages',
      severity: 'error'
    });
  }

  // Validate featured image if present
  if (page.featuredImage) {
    errors.push(...validateSanityImage(page.featuredImage, 'featuredImage', false));
  }

  // Validate SEO data if present
  if (page.seo) {
    if (page.seo.metaTitle) {
      errors.push(...validateMultilingualText(page.seo.metaTitle, 'seo.metaTitle', false));
    }
    if (page.seo.metaDescription) {
      errors.push(...validateMultilingualText(page.seo.metaDescription, 'seo.metaDescription', false));
    }
  }

  return {
    isValid: errors.filter(e => e.severity === 'error').length === 0,
    errors: errors.filter(e => e.severity === 'error'),
    warnings: errors.filter(e => e.severity === 'warning')
  };
}

/**
 * Validate NewsEvent content
 */
export function validateNewsEvent(newsEvent: NewsEvent): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate required fields
  errors.push(...validateMultilingualText(newsEvent.title, 'title', true));
  errors.push(...validateMultilingualSlug(newsEvent.slug, 'slug', true));
  errors.push(...validateSanityImage(newsEvent.featuredImage, 'featuredImage', true));

  // Validate content
  if (!newsEvent.content?.bengali || !newsEvent.content?.english) {
    errors.push({
      field: 'content',
      message: 'Content is required in both languages',
      severity: 'error'
    });
  }

  // Validate category
  const validCategories = ['news', 'event', 'achievement', 'announcement'];
  if (!validCategories.includes(newsEvent.category)) {
    errors.push({
      field: 'category',
      message: `Category must be one of: ${validCategories.join(', ')}`,
      severity: 'error'
    });
  }

  // Validate event date for events
  if (newsEvent.category === 'event' && !newsEvent.eventDate) {
    errors.push({
      field: 'eventDate',
      message: 'Event date is required for events',
      severity: 'error'
    });
  }

  // Validate gallery images if present
  if (newsEvent.gallery) {
    newsEvent.gallery.forEach((image, index) => {
      errors.push(...validateSanityImage(image, `gallery[${index}]`, false));
    });
  }

  return {
    isValid: errors.filter(e => e.severity === 'error').length === 0,
    errors: errors.filter(e => e.severity === 'error'),
    warnings: errors.filter(e => e.severity === 'warning')
  };
}

/**
 * Validate AcademicProgram content
 */
export function validateAcademicProgram(program: AcademicProgram): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate required fields
  errors.push(...validateMultilingualText(program.title, 'title', true));
  errors.push(...validateMultilingualSlug(program.slug, 'slug', true));

  if (!program.ageRange) {
    errors.push({
      field: 'ageRange',
      message: 'Age range is required',
      severity: 'error'
    });
  }

  // Validate curriculum content
  if (!program.islamicCurriculum?.subjects?.length && !program.nctbCurriculum?.subjects?.length) {
    errors.push({
      field: 'curriculum',
      message: 'At least one curriculum (Islamic or NCTB) must have subjects',
      severity: 'error'
    });
  }

  // Validate subjects in curricula
  if (program.islamicCurriculum?.subjects) {
    program.islamicCurriculum.subjects.forEach((subject, index) => {
      errors.push(...validateMultilingualText(subject.name, `islamicCurriculum.subjects[${index}].name`, true));
    });
  }

  if (program.nctbCurriculum?.subjects) {
    program.nctbCurriculum.subjects.forEach((subject, index) => {
      errors.push(...validateMultilingualText(subject.name, `nctbCurriculum.subjects[${index}].name`, true));
    });
  }

  return {
    isValid: errors.filter(e => e.severity === 'error').length === 0,
    errors: errors.filter(e => e.severity === 'error'),
    warnings: errors.filter(e => e.severity === 'warning')
  };
}

/**
 * Validate StaffMember content
 */
export function validateStaffMember(staff: StaffMember): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate required fields
  errors.push(...validateMultilingualText(staff.name, 'name', true));
  errors.push(...validateMultilingualText(staff.position, 'position', true));

  // Validate department
  const validDepartments = ['administration', 'islamic_studies', 'nctb_curriculum', 'co_curricular', 'support_staff'];
  if (!validDepartments.includes(staff.department)) {
    errors.push({
      field: 'department',
      message: `Department must be one of: ${validDepartments.join(', ')}`,
      severity: 'error'
    });
  }

  // Validate photo if present
  if (staff.photo) {
    errors.push(...validateSanityImage(staff.photo, 'photo', false));
  }

  // Validate leadership requirements
  if (staff.isLeadership && !staff.biography) {
    errors.push({
      field: 'biography',
      message: 'Biography is required for leadership team members',
      severity: 'error'
    });
  }

  return {
    isValid: errors.filter(e => e.severity === 'error').length === 0,
    errors: errors.filter(e => e.severity === 'error'),
    warnings: errors.filter(e => e.severity === 'warning')
  };
}

/**
 * Validate Facility content
 */
export function validateFacility(facility: Facility): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate required fields
  errors.push(...validateMultilingualText(facility.name, 'name', true));
  errors.push(...validateMultilingualSlug(facility.slug, 'slug', true));

  // Validate category
  const validCategories = ['academic', 'islamic', 'recreational', 'administrative', 'support'];
  if (!validCategories.includes(facility.category)) {
    errors.push({
      field: 'category',
      message: `Category must be one of: ${validCategories.join(', ')}`,
      severity: 'error'
    });
  }

  // Validate images
  if (!facility.images || facility.images.length === 0) {
    errors.push({
      field: 'images',
      message: 'At least one image is required',
      severity: 'error'
    });
  } else {
    facility.images.forEach((image, index) => {
      errors.push(...validateSanityImage(image, `images[${index}]`, true));
    });
  }

  return {
    isValid: errors.filter(e => e.severity === 'error').length === 0,
    errors: errors.filter(e => e.severity === 'error'),
    warnings: errors.filter(e => e.severity === 'warning')
  };
}

/**
 * Validate SiteSettings content
 */
export function validateSiteSettings(settings: SiteSettings): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate required fields
  errors.push(...validateMultilingualText(settings.title, 'title', true));

  // Validate contact info
  if (settings.contactInfo) {
    if (settings.contactInfo.phone && settings.contactInfo.phone.length === 0) {
      errors.push({
        field: 'contactInfo.phone',
        message: 'At least one phone number is required',
        severity: 'warning'
      });
    }

    if (settings.contactInfo.email && settings.contactInfo.email.length === 0) {
      errors.push({
        field: 'contactInfo.email',
        message: 'At least one email address is required',
        severity: 'warning'
      });
    }
  }

  // Validate logo and favicon
  if (settings.logo) {
    errors.push(...validateSanityImage(settings.logo, 'logo', false));
  }

  if (settings.favicon) {
    errors.push(...validateSanityImage(settings.favicon, 'favicon', false));
  }

  return {
    isValid: errors.filter(e => e.severity === 'error').length === 0,
    errors: errors.filter(e => e.severity === 'error'),
    warnings: errors.filter(e => e.severity === 'warning')
  };
}

/**
 * Batch validate multiple content items
 */
export function batchValidateContent(
  items: Array<{ type: string; data: any }>,
  onProgress?: (completed: number, total: number) => void
): Array<{ id: string; type: string; validation: ValidationResult }> {
  const results: Array<{ id: string; type: string; validation: ValidationResult }> = [];

  items.forEach((item, index) => {
    let validation: ValidationResult;

    switch (item.type) {
      case 'page':
        validation = validatePage(item.data);
        break;
      case 'newsEvent':
        validation = validateNewsEvent(item.data);
        break;
      case 'academicProgram':
        validation = validateAcademicProgram(item.data);
        break;
      case 'staffMember':
        validation = validateStaffMember(item.data);
        break;
      case 'facility':
        validation = validateFacility(item.data);
        break;
      case 'siteSettings':
        validation = validateSiteSettings(item.data);
        break;
      default:
        validation = {
          isValid: false,
          errors: [{ field: 'type', message: `Unknown content type: ${item.type}`, severity: 'error' }],
          warnings: []
        };
    }

    results.push({
      id: item.data._id || `item-${index}`,
      type: item.type,
      validation
    });

    if (onProgress) {
      onProgress(index + 1, items.length);
    }
  });

  return results;
}