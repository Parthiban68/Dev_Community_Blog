import { Column, DataType, Default, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { ChannelType, ChannelVisibility } from '../community.types';

@Table({ tableName: 'channels', underscored: true, timestamps: true })
export class Channel extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column({ type: DataType.UUID, allowNull: false })
  communityId!: string;

  @Column({ type: DataType.STRING(120), allowNull: false })
  name!: string;

  @Column({ type: DataType.STRING(140), allowNull: false })
  slug!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  description!: string | null;

  @Default('text')
  @Column(DataType.ENUM('text', 'announcement', 'question', 'resources'))
  type!: ChannelType;

  @Default('public')
  @Column(DataType.ENUM('public', 'private'))
  visibility!: ChannelVisibility;

  @Column({ type: DataType.UUID, allowNull: false })
  createdByUserId!: string;

  declare createdAt: Date;

  declare updatedAt: Date;
}
