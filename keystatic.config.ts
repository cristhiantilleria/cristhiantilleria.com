// Keystatic CMS: content lives in src/content as YAML/MDX and is committed with the code.
// Admin UI at http://127.0.0.1:4321/keystatic while `npm run dev` is running (local storage only).
import { config, fields, collection, singleton } from '@keystatic/core';

const media = (dir: string) => ({ directory: `public/media/${dir}`, publicPath: `/media/${dir}/` });

export default config({
  storage: { kind: 'local' },
  ui: {
    brand: { name: 'Cristhian Tilleria' },
    navigation: { Content: ['projects'], Pages: ['site', 'visuals'] },
  },
  singletons: {
    site: singleton({
      label: 'Site content',
      path: 'src/content/site',
      format: { data: 'yaml' },
      schema: {
        url: fields.url({ label: 'Site address', validation: { isRequired: true } }),
        description: fields.text({ label: 'Search description (home page)', multiline: true }),
        email: fields.text({ label: 'Contact email', validation: { isRequired: true } }),
        bookingUrl: fields.url({ label: 'Calendar booking link (Cal.com)' }),
        status: fields.text({ label: 'Availability status' }),
        intro: fields.text({ label: 'Hero intro line', multiline: true }),
        statement: fields.text({ label: 'About statement', multiline: true }),
        portrait: fields.image({ label: 'About portrait', ...media('about') }),
        ticker: fields.array(fields.text({ label: 'Phrase' }), { label: 'Ticker phrases', itemLabel: (p) => p.value }),
        services: fields.array(
          fields.object({
            title: fields.text({ label: 'Title' }),
            description: fields.text({ label: 'Description', multiline: true }),
          }),
          { label: 'Services', itemLabel: (p) => p.fields.title.value }
        ),
        steps: fields.array(
          fields.object({
            tag: fields.text({ label: 'Small tag' }),
            title: fields.text({ label: 'Title' }),
            description: fields.text({ label: 'Description', multiline: true }),
          }),
          { label: 'Process steps', itemLabel: (p) => p.fields.title.value }
        ),
        socials: fields.array(
          fields.object({
            label: fields.text({ label: 'Label' }),
            url: fields.url({ label: 'URL' }),
          }),
          { label: 'Social links', itemLabel: (p) => p.fields.label.value }
        ),
      },
    }),
    visuals: singleton({
      label: 'Lab (visuals)',
      path: 'src/content/visuals',
      format: { data: 'yaml' },
      schema: {
        intro: fields.text({ label: 'Intro line', multiline: true }),
        items: fields.array(
          fields.object({
            image: fields.image({ label: 'Image', ...media('visuals'), validation: { isRequired: true } }),
            title: fields.text({ label: 'Title' }),
            kind: fields.text({ label: 'Kind (e.g. Photography or Experiment)' }),
            alt: fields.text({ label: 'Alt text (describe the image)' }),
          }),
          { label: 'Pieces', itemLabel: (p) => p.fields.title.value || 'Untitled' }
        ),
      },
    }),
  },
  collections: {
    projects: collection({
      label: 'Projects',
      path: 'src/content/projects/*',
      slugField: 'title',
      format: { contentField: 'body' },
      entryLayout: 'content',
      columns: ['title', 'type', 'order'],
      schema: {
        title: fields.slug({ name: { label: 'Title' }, slug: { label: 'URL slug (/work/<slug>)' } }),
        type: fields.text({ label: 'Type (e.g. Design + build)' }),
        year: fields.text({ label: 'Year' }),
        role: fields.text({ label: 'Your role' }),
        order: fields.integer({ label: 'Order (1 = first)', defaultValue: 99 }),
        published: fields.checkbox({ label: 'Show on site', defaultValue: true }),
        cover: fields.image({ label: 'Cover image', ...media('projects') }),
        video: fields.file({ label: 'Cover video (optional short muted MP4 that loops on the card)', ...media('projects') }),
        link: fields.url({ label: 'Live site URL' }),
        summary: fields.text({ label: 'Summary (one or two sentences)', multiline: true }),
        approach: fields.text({ label: 'Approach (short paragraph)', multiline: true }),
        label: fields.text({ label: 'Card label (e.g. Concept identity, 2023)' }),
        disclaimer: fields.text({ label: 'Disclaimer (optional, e.g. unofficial concept)' }),
        gallery: fields.array(fields.image({ label: 'Image', ...media('projects'), validation: { isRequired: true } }), {
          label: 'Gallery',
          itemLabel: (p) => p.value?.filename || 'Image',
        }),
        body: fields.mdx({
          label: 'Extra case study text (optional)',
          options: { image: { directory: 'public/media/projects', publicPath: '/media/projects/' } },
        }),
      },
    }),
  },
});
