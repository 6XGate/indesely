import { defineConfig } from 'vitepress';
import type { DefaultTheme } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Indesely',
  description: 'IndexedDB with Kysely Style',
  cleanUrls: true,
  themeConfig: {
    nav: nav(),

    sidebar: {
      '/guide/': { base: '/guide/', items: sidebarGuide() },
      '/reference/': { base: '/reference/', items: sidebarReference() },
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/sixxgate/indesely' }],
  },
});

type NavItem = DefaultTheme.NavItem;

function nav(): NavItem[] {
  return [
    { text: 'Home', link: '/' },
    { text: 'Guide', link: '/guide/what-is-indesely' },
    { text: 'Reference', link: '/reference/management' },
  ];
}

type SidebarItem = DefaultTheme.SidebarItem;

function sidebarGuide(): SidebarItem[] {
  return [
    {
      text: 'Introduction',
      collapsed: false,
      items: [
        { text: 'What is Indesely?', link: 'what-is-indesely' },
        { text: 'Getting Started', link: 'getting-started' },
      ],
    },
    {
      text: 'Using Databases',
      collapsed: false,
      items: [
        { text: 'Defining the Schema', link: 'defining-the-schema' },
        { text: 'Migrations', link: 'migrations' },
        { text: 'Reading and Writing Data', link: 'reading-and-writing-data' },
        { text: 'Managing Databases', link: 'managing-databases' },
      ],
    },
    { text: 'API Reference', link: '../reference/management' },
  ];
}

function sidebarReference(): SidebarItem[] {
  return [
    {
      text: 'Database API',
      items: [
        { text: 'Management', link: 'management' },
        { text: 'Database', link: 'database' },
        { text: 'Schema', link: 'schema' },
      ],
    },
    {
      text: 'Migration API',
      items: [
        { text: 'Migrations', link: 'migrations' },
        { text: 'DatabaseBuilder', link: 'database-builder' },
        { text: 'StoreBuilder', link: 'store-builder' },
      ],
    },
    {
      text: 'Query API',
      items: [
        { text: 'Transaction', link: 'transaction' },
        { text: 'SelectQueryBuilder', link: 'select-query-builder' },
        { text: 'UpdateQueryBuilder', link: 'update-query-builder' },
        { text: 'DeleteQueryBuilder', link: 'delete-query-builder' },
        { text: 'Cursor', link: 'cursor' },
      ],
    },
  ];
}
