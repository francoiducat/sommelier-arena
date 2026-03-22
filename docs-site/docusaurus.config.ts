import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Sommelier Arena',
  tagline: 'Real-time blind wine tasting quiz — developer docs',
  favicon: 'img/favicon.ico',

  url: 'https://sommelier-arena.ducatillon.net',
  baseUrl: '/docs/',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
          lastVersion: 'current',
          versions: {
            current: {
              label: '2.0 PartyKit',
              path: '/',
            },
            '1.0-nestjs': {
              label: '1.0 NestJS (legacy)',
              path: '/v1',
              banner: 'unmaintained',
            },
          },
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    navbar: {
      title: '🍷 Sommelier Arena',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docs',
          position: 'left',
          label: 'Docs',
        },
        {
          type: 'docsVersionDropdown',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'light',
      copyright: `Sommelier Arena MVP — ${new Date().getFullYear()}`,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
