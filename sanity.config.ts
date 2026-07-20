import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';

import { schemaTypes } from './sanity/schemas';
import { structure } from './sanity/structure';
import { StudioLogo } from './sanity/components/StudioLogo';
import { DownloadLinksTool } from './sanity/tools/DownloadLinksTool';
import { ShareDownloadAction } from './sanity/actions/ShareDownloadAction';
import { RevokeDownloadLinksAction } from './sanity/actions/RevokeDownloadLinksAction';

export default defineConfig({
  name: 'madrasatul-quran-website',
  title: 'Madrasatul Quran Website',

  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,

  basePath: '/studio',

  plugins: [structureTool({ structure }), visionTool()],

  tools: (prev) => [
    ...prev,
    {
      name: 'download-links',
      title: 'Download Links',
      component: DownloadLinksTool,
    },
  ],

  schema: {
    types: schemaTypes,
  },

  document: {
    actions: (prev, context) =>
      ['downloadCategory', 'downloadable'].includes(context.schemaType)
        ? [...prev, ShareDownloadAction, RevokeDownloadLinksAction]
        : prev,
  },

  // Configure the studio
  studio: {
    components: {
      logo: StudioLogo,
    },
  },
});
