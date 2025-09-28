// Islamic Patterns and Design Elements
export {
  IslamicPattern,
  IslamicBorder,
  IslamicDivider,
  IslamicCard,
  IslamicButton,
} from './islamic-patterns';

// Typography Components
export {
  Typography,
  Heading,
  Text,
  Quote,
  List,
  ListItem,
  Badge,
} from './typography';

// Layout Components
export {
  Container,
  Grid,
  Flex,
  Section,
  Spacer,
  Card,
  Divider,
} from './layout';

// Rich Text Component
export { RichText } from './rich-text';

// Reactbits-inspired micro-components
export { SplitText } from './SplitText';
export { ClickSpark } from './ClickSpark';

// Download Components
export { default as ProspectusDownload } from './prospectus-download';
export { default as CurriculumDownload } from './curriculum-download';

// Design System Utilities
export {
  cn,
  DESIGN_TOKENS,
  COMPONENT_VARIANTS,
  ISLAMIC_PATTERNS,
  ANIMATIONS,
  BREAKPOINTS,
  getResponsiveClasses,
  getFontClass,
  getTextDirection,
  getIslamicColor,
  SIZE_VARIANTS,
  generateIslamicPattern,
  A11Y_CLASSES,
  PRINT_CLASSES,
} from '@/lib/design-system';