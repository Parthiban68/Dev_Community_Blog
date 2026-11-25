'use strict';

require('dotenv').config();

const { createHash } = require('crypto');
const { QueryTypes, Sequelize } = require('sequelize');
const environmentConfigs = require('../src/database/sequelize-cli.config.cjs');

const COMMUNITY_SLUG = 'frontend-developers-learning';
const BASE_TIME = new Date('2026-11-24T09:00:00.000Z');

const CHANNELS = [
  {
    slug: 'announcements',
    type: 'announcement',
    description: 'Workspace announcements and onboarding notes.',
  },
  {
    slug: 'frontend-help',
    type: 'question',
    description: 'Ask frontend questions and share answers.',
  },
  {
    slug: 'javascript',
    type: 'text',
    description: 'JavaScript language discussion and tips.',
  },
  {
    slug: 'react',
    type: 'question',
    description: 'React components, hooks and patterns.',
  },
  {
    slug: 'typescript',
    type: 'text',
    description: 'TypeScript typing and tooling discussion.',
  },
  {
    slug: 'css-tailwind',
    type: 'text',
    description: 'CSS, layout and Tailwind CSS help.',
  },
  {
    slug: 'projects',
    type: 'text',
    description: 'Share learning projects and request feedback.',
  },
  {
    slug: 'resources',
    type: 'resources',
    description: 'Links, docs and references for frontend developers.',
  },
];

const MESSAGES = [
  {
    key: 'welcome-announcement',
    channel: 'announcements',
    authorIndex: 0,
    kind: 'announcement',
    minutes: 0,
    body: '[DEV SEED] Welcome to Frontend Developers Learning. Introduce yourself and ask questions in frontend-help.',
  },
  {
    key: 'layout-question',
    channel: 'frontend-help',
    authorIndex: 2,
    kind: 'question',
    minutes: 5,
    body: '[DEV SEED] What is the simplest modern way to vertically center a child element?',
  },
  {
    key: 'layout-answer',
    channel: 'frontend-help',
    parentKey: 'layout-question',
    authorIndex: 1,
    kind: 'answer',
    minutes: 8,
    body: '[DEV SEED] CSS grid with place-items is usually the cleanest option. Full example below.',
    code: '.parent {\n  display: grid;\n  place-items: center;\n  min-height: 100vh;\n}',
    language: 'css',
  },
  {
    key: 'javascript-tip',
    channel: 'javascript',
    authorIndex: 0,
    kind: 'message',
    minutes: 12,
    body: '[DEV SEED] Dedupe arrays with Set when order does not need to be recalculated manually.',
    code: 'const unique = (items) => [...new Set(items)];',
    language: 'javascript',
  },
  {
    key: 'effect-question',
    channel: 'react',
    authorIndex: 2,
    kind: 'question',
    minutes: 18,
    body: '[DEV SEED] When should I use useEffect for data fetching in a component?',
  },
  {
    key: 'effect-answer',
    channel: 'react',
    parentKey: 'effect-question',
    authorIndex: 1,
    kind: 'answer',
    minutes: 22,
    body: '[DEV SEED] Prefer your framework data layer or a dedicated query library; use an effect only for genuine synchronization.',
    code: 'useEffect(() => {\n  const controller = new AbortController();\n  load({ signal: controller.signal });\n  return () => controller.abort();\n}, []);',
    language: 'typescript',
  },
  {
    key: 'typescript-generic',
    channel: 'typescript',
    authorIndex: 1,
    kind: 'message',
    minutes: 27,
    body: '[DEV SEED] A small generic helper makes API responses much easier to reason about.',
    code: 'type ApiResult<T> = { data: T; error: null } | { data: null; error: string };\nconst ok = <T>(data: T): ApiResult<T> => ({ data, error: null });',
    language: 'typescript',
  },
  {
    key: 'tailwind-layout',
    channel: 'css-tailwind',
    authorIndex: 0,
    kind: 'message',
    minutes: 33,
    body: '[DEV SEED] Tailwind layout snippet for a responsive card grid.',
    code: '<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">\n  <!-- cards -->\n</div>',
    language: 'html',
  },
  {
    key: 'project-kickoff',
    channel: 'projects',
    authorIndex: 2,
    kind: 'message',
    minutes: 38,
    body: '[DEV SEED] Project idea: build a component playground and share accessibility notes with the channel.',
  },
  {
    key: 'docs-link',
    channel: 'resources',
    authorIndex: 1,
    kind: 'resource',
    minutes: 42,
    body: '[DEV SEED] Starting point for learning modern web platform APIs.',
    linkUrl: 'https://developer.mozilla.org/en-US/docs/Web',
    linkTitle: 'MDN Web Docs',
  },
];

const RESOURCES = [
  {
    key: 'mdn-javascript',
    channel: 'javascript',
    type: 'link',
    title: 'MDN JavaScript Guide',
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
    source: 'MDN',
  },
  {
    key: 'react-docs',
    channel: 'react',
    type: 'link',
    title: 'React Documentation',
    url: 'https://react.dev/',
    source: 'React',
  },
  {
    key: 'typescript-handbook',
    channel: 'typescript',
    type: 'link',
    title: 'TypeScript Handbook',
    url: 'https://www.typescriptlang.org/docs/handbook/intro.html',
    source: 'TypeScript',
  },
  {
    key: 'tailwind-docs',
    channel: 'css-tailwind',
    type: 'link',
    title: 'Tailwind CSS Documentation',
    url: 'https://tailwindcss.com/docs',
    source: 'Tailwind CSS',
  },
];

const REACTIONS = [
  { messageKey: 'welcome-announcement', userIndex: 0, emoji: '🎉' },
  { messageKey: 'welcome-announcement', userIndex: 1, emoji: '👋' },
  { messageKey: 'layout-answer', userIndex: 0, emoji: '👍' },
  { messageKey: 'javascript-tip', userIndex: 1, emoji: '🚀' },
  { messageKey: 'effect-answer', userIndex: 0, emoji: '💡' },
  { messageKey: 'typescript-generic', userIndex: 2, emoji: '👍' },
];

function deterministicUuid(key) {
  const hash = createHash('sha256').update(key).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

function seededDate(minutes) {
  return new Date(BASE_TIME.getTime() + minutes * 60_000);
}

function buildSequelize() {
  const environment = process.env.NODE_ENV || 'development';
  if (environment === 'production') {
    throw new Error('The community workspace seeder is for development only.');
  }
  const config = environmentConfigs[environment] || environmentConfigs.development;
  if (config.url) {
    return new Sequelize(config.url, {
      logging: false,
      dialectOptions: config.dialectOptions,
    });
  }
  return new Sequelize({
    dialect: 'postgres',
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: config.database,
    logging: false,
  });
}

async function seed() {
  const users = await sequelize.query(
    "SELECT id FROM users WHERE status = 'active' ORDER BY created_at ASC, id ASC",
    { type: QueryTypes.SELECT },
  );
  if (users.length === 0) {
    throw new Error('Create at least one active user before running this seeder.');
  }

  const communityId = deterministicUuid(`community:${COMMUNITY_SLUG}`);
  const sharedAt = seededDate(0);
  await sequelize.query(
    `INSERT INTO communities
       (id, name, slug, description, cover_image_url, visibility, created_at, updated_at)
     VALUES
       (:id, :name, :slug, :description, NULL, 'public', :createdAt, :updatedAt)
     ON CONFLICT (slug) DO UPDATE SET
       name = EXCLUDED.name,
       description = EXCLUDED.description,
       visibility = 'public',
       updated_at = EXCLUDED.updated_at`,
    {
      replacements: {
        id: communityId,
        name: 'Frontend Developers Learning',
        slug: COMMUNITY_SLUG,
        description: '[DEV SEED] A shared workspace for frontend learning, questions and resources.',
        createdAt: sharedAt,
        updatedAt: sharedAt,
      },
    },
  );

  const firstUserId = users[0].id;
  for (const channel of CHANNELS) {
    await sequelize.query(
      `INSERT INTO channels
         (id, community_id, name, slug, description, type, visibility, created_by_user_id, created_at, updated_at)
       VALUES
         (:id, :communityId, :name, :slug, :description, :type, 'public', :createdByUserId, :createdAt, :updatedAt)
       ON CONFLICT (community_id, slug) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         type = EXCLUDED.type,
         visibility = 'public',
         updated_at = EXCLUDED.updated_at`,
      {
        replacements: {
          id: deterministicUuid(`channel:${COMMUNITY_SLUG}:${channel.slug}`),
          communityId,
          name: channel.slug,
          slug: channel.slug,
          description: channel.description,
          type: channel.type,
          createdByUserId: firstUserId,
          createdAt: sharedAt,
          updatedAt: sharedAt,
        },
      },
    );
  }

  for (const [index, user] of users.entries()) {
    const role = index === 0 ? 'owner' : index === 1 ? 'moderator' : 'member';
    await sequelize.query(
      `INSERT INTO community_members
         (id, community_id, user_id, role, joined_at, created_at, updated_at)
       VALUES
         (:id, :communityId, :userId, :role, :joinedAt, :createdAt, :updatedAt)
       ON CONFLICT (community_id, user_id) DO UPDATE SET
         role = EXCLUDED.role,
         updated_at = EXCLUDED.updated_at`,
      {
        replacements: {
          id: deterministicUuid(`community-member:${COMMUNITY_SLUG}:${user.id}`),
          communityId,
          userId: user.id,
          role,
          joinedAt: sharedAt,
          createdAt: sharedAt,
          updatedAt: sharedAt,
        },
      },
    );
  }

  const channelRows = await sequelize.query(
    'SELECT id, slug FROM channels WHERE community_id = :communityId',
    { replacements: { communityId }, type: QueryTypes.SELECT },
  );
  const channelIdBySlug = new Map(channelRows.map((channel) => [channel.slug, channel.id]));
  const authorId = (index) => users[Math.min(index, users.length - 1)].id;

  for (const [index, message] of MESSAGES.entries()) {
    const channelId = channelIdBySlug.get(message.channel);
    if (!channelId) {
      throw new Error(`Missing channel for seed message: ${message.key}`);
    }
    const createdAt = seededDate(message.minutes ?? index);
    await sequelize.query(
      `INSERT INTO messages
         (id, channel_id, parent_message_id, author_id, body, kind, code, language, link_url, link_title, created_at, updated_at)
       VALUES
         (:id, :channelId, :parentMessageId, :authorId, :body, :kind, :code, :language, :linkUrl, :linkTitle, :createdAt, :updatedAt)
       ON CONFLICT (id) DO NOTHING`,
      {
        replacements: {
          id: deterministicUuid(`message:${message.key}`),
          channelId,
          parentMessageId: message.parentKey
            ? deterministicUuid(`message:${message.parentKey}`)
            : null,
          authorId: authorId(message.authorIndex),
          body: message.body,
          kind: message.kind,
          code: message.code ?? null,
          language: message.language ?? null,
          linkUrl: message.linkUrl ?? null,
          linkTitle: message.linkTitle ?? null,
          createdAt,
          updatedAt: createdAt,
        },
      },
    );
  }

  for (const [index, resource] of RESOURCES.entries()) {
    const channelId = channelIdBySlug.get(resource.channel);
    if (!channelId) {
      throw new Error(`Missing channel for seed resource: ${resource.key}`);
    }
    const createdAt = seededDate(60 + index * 3);
    await sequelize.query(
      `INSERT INTO channel_resources
         (id, channel_id, type, title, url, source, shared_by_user_id, created_at, updated_at)
       VALUES
         (:id, :channelId, :type, :title, :url, :source, :sharedByUserId, :createdAt, :updatedAt)
       ON CONFLICT (id) DO NOTHING`,
      {
        replacements: {
          id: deterministicUuid(`resource:${resource.key}`),
          channelId,
          type: resource.type,
          title: resource.title,
          url: resource.url,
          source: resource.source,
          sharedByUserId: authorId(index),
          createdAt,
          updatedAt: createdAt,
        },
      },
    );
  }

  for (const [index, reaction] of REACTIONS.entries()) {
    const createdAt = seededDate(90 + index);
    await sequelize.query(
      `INSERT INTO message_reactions
         (id, message_id, user_id, emoji, created_at, updated_at)
       VALUES
         (:id, :messageId, :userId, :emoji, :createdAt, :updatedAt)
       ON CONFLICT (message_id, user_id, emoji) DO NOTHING`,
      {
        replacements: {
          id: deterministicUuid(`reaction:${reaction.messageKey}:${reaction.userIndex}:${reaction.emoji}`),
          messageId: deterministicUuid(`message:${reaction.messageKey}`),
          userId: authorId(reaction.userIndex),
          emoji: reaction.emoji,
          createdAt,
          updatedAt: createdAt,
        },
      },
    );
  }
}

const sequelize = buildSequelize();

async function main() {
  try {
    await seed();
    console.log('Community workspace seed completed.');
  } finally {
    await sequelize.close();
  }
}

main().catch(() => {
  console.error('Community workspace seed failed.');
  process.exitCode = 1;
});
