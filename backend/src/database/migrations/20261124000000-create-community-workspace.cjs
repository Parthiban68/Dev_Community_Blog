'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('communities', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      name: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING(140),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      cover_image_url: {
        type: Sequelize.STRING(2048),
        allowNull: true,
      },
      visibility: {
        type: Sequelize.ENUM('public', 'private'),
        allowNull: false,
        defaultValue: 'public',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
    await queryInterface.addIndex('communities', ['slug'], {
      name: 'communities_slug_unique',
      unique: true,
    });

    await queryInterface.createTable('community_members', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      community_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'communities', key: 'id' },
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      role: {
        type: Sequelize.ENUM('owner', 'admin', 'moderator', 'member'),
        allowNull: false,
        defaultValue: 'member',
      },
      joined_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
    await queryInterface.addIndex('community_members', ['community_id', 'user_id'], {
      name: 'community_members_community_user_unique',
      unique: true,
    });
    await queryInterface.addIndex('community_members', ['user_id'], {
      name: 'community_members_user_id_idx',
    });

    await queryInterface.createTable('channels', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      community_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'communities', key: 'id' },
        onDelete: 'CASCADE',
      },
      name: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING(140),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      type: {
        type: Sequelize.ENUM('text', 'announcement', 'question', 'resources'),
        allowNull: false,
        defaultValue: 'text',
      },
      visibility: {
        type: Sequelize.ENUM('public', 'private'),
        allowNull: false,
        defaultValue: 'public',
      },
      created_by_user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
    await queryInterface.addIndex('channels', ['community_id', 'slug'], {
      name: 'channels_community_slug_unique',
      unique: true,
    });
    await queryInterface.addIndex('channels', ['created_by_user_id'], {
      name: 'channels_created_by_user_id_idx',
    });

    await queryInterface.createTable('channel_members', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      channel_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'channels', key: 'id' },
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
    await queryInterface.addIndex('channel_members', ['channel_id', 'user_id'], {
      name: 'channel_members_channel_user_unique',
      unique: true,
    });
    await queryInterface.addIndex('channel_members', ['user_id'], {
      name: 'channel_members_user_id_idx',
    });

    await queryInterface.createTable('messages', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      channel_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'channels', key: 'id' },
        onDelete: 'CASCADE',
      },
      parent_message_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'messages', key: 'id' },
        onDelete: 'CASCADE',
      },
      author_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      body: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      kind: {
        type: Sequelize.ENUM('message', 'question', 'answer', 'announcement', 'resource'),
        allowNull: false,
        defaultValue: 'message',
      },
      code: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      language: {
        type: Sequelize.STRING(40),
        allowNull: true,
      },
      link_url: {
        type: Sequelize.STRING(2048),
        allowNull: true,
      },
      link_title: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
    await queryInterface.addIndex('messages', ['channel_id', 'created_at', 'id'], {
      name: 'messages_channel_cursor_idx',
    });
    await queryInterface.addIndex('messages', ['parent_message_id'], {
      name: 'messages_parent_message_id_idx',
    });
    await queryInterface.addIndex('messages', ['author_id'], {
      name: 'messages_author_id_idx',
    });

    await queryInterface.createTable('message_reactions', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      message_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'messages', key: 'id' },
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      emoji: {
        type: Sequelize.STRING(16),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
    await queryInterface.addIndex('message_reactions', ['message_id', 'user_id', 'emoji'], {
      name: 'message_reactions_message_user_emoji_unique',
      unique: true,
    });
    await queryInterface.addIndex('message_reactions', ['user_id'], {
      name: 'message_reactions_user_id_idx',
    });

    await queryInterface.createTable('channel_resources', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      channel_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'channels', key: 'id' },
        onDelete: 'CASCADE',
      },
      type: {
        type: Sequelize.ENUM('link', 'image', 'file'),
        allowNull: false,
        defaultValue: 'link',
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      url: {
        type: Sequelize.STRING(2048),
        allowNull: false,
      },
      source: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      shared_by_user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
    await queryInterface.addIndex('channel_resources', ['channel_id', 'type'], {
      name: 'channel_resources_channel_type_idx',
    });
    await queryInterface.addIndex('channel_resources', ['shared_by_user_id'], {
      name: 'channel_resources_shared_by_user_id_idx',
    });

    await queryInterface.createTable('message_reports', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      message_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'messages', key: 'id' },
        onDelete: 'CASCADE',
      },
      reporter_user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
    await queryInterface.addIndex('message_reports', ['message_id', 'reporter_user_id'], {
      name: 'message_reports_message_reporter_unique',
      unique: true,
    });
    await queryInterface.addIndex('message_reports', ['reporter_user_id'], {
      name: 'message_reports_reporter_user_id_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('message_reports');
    await queryInterface.dropTable('channel_resources');
    await queryInterface.dropTable('message_reactions');
    await queryInterface.dropTable('messages');
    await queryInterface.dropTable('channel_members');
    await queryInterface.dropTable('channels');
    await queryInterface.dropTable('community_members');
    await queryInterface.dropTable('communities');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_community_members_role";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_channels_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_channels_visibility";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_messages_kind";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_channel_resources_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_communities_visibility";');
  },
};
