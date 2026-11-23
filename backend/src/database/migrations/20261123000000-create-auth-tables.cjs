'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      username: {
        type: Sequelize.STRING(30),
        allowNull: false,
        unique: true,
      },
      email: {
        type: Sequelize.STRING(254),
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      display_name: {
        type: Sequelize.STRING(80),
        allowNull: false,
      },
      bio: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      avatar_url: {
        type: Sequelize.STRING(2048),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('active', 'disabled', 'suspended'),
        allowNull: false,
        defaultValue: 'active',
      },
      email_verified_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      onboarding_completed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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

    await queryInterface.createTable('auth_sessions', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      family_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      refresh_token_hash: {
        type: Sequelize.CHAR(64),
        allowNull: false,
        unique: true,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      revoked_at: {
        type: Sequelize.DATE,
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
    await queryInterface.addIndex('auth_sessions', ['user_id'], {
      name: 'auth_sessions_user_id_idx',
    });
    await queryInterface.addIndex('auth_sessions', ['family_id'], {
      name: 'auth_sessions_family_id_idx',
    });

    await queryInterface.createTable('password_reset_tokens', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      token_hash: {
        type: Sequelize.CHAR(64),
        allowNull: false,
        unique: true,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      used_at: {
        type: Sequelize.DATE,
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
    await queryInterface.addIndex('password_reset_tokens', ['user_id'], {
      name: 'password_reset_tokens_user_id_idx',
    });

    await queryInterface.createTable('oauth_accounts', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      provider: {
        type: Sequelize.STRING(32),
        allowNull: false,
      },
      provider_account_id: {
        type: Sequelize.STRING(191),
        allowNull: false,
      },
      access_token_hash: {
        type: Sequelize.CHAR(64),
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
    await queryInterface.addIndex('oauth_accounts', ['provider', 'provider_account_id'], {
      name: 'oauth_accounts_provider_account_unique',
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('oauth_accounts');
    await queryInterface.dropTable('password_reset_tokens');
    await queryInterface.dropTable('auth_sessions');
    await queryInterface.dropTable('users');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_status";');
  },
};
