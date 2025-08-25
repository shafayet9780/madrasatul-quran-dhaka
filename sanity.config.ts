import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';

import { schemaTypes } from './sanity/schemas';
import { structure } from './sanity/structure';
import { StudioLogo } from './sanity/components/StudioLogo';

export default defineConfig({
  name: 'madrasatul-quran-website',
  title: 'Madrasatul Quran Website',

  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,

  basePath: '/studio',

  plugins: [structureTool({ structure }), visionTool()],

  schema: {
    types: schemaTypes,
  },

  // Configure the studio
  studio: {
    components: {
      logo: StudioLogo,
    },
  },
});
