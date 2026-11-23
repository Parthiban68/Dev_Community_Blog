import { Column, DataType, Default, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { User } from './user.entity';

@Table({ tableName: 'oauth_accounts', underscored: true })
export class OAuthAccount extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  userId!: string;

  @Default('github')
  @Column({ type: DataType.STRING(32), allowNull: false })
  provider!: string;

  @Column({ type: DataType.STRING(191), allowNull: false })
  providerAccountId!: string;

  @Column({ type: DataType.CHAR(64), allowNull: true })
  accessTokenHash!: string | null;

  declare createdAt: Date;

  declare updatedAt: Date;
}
