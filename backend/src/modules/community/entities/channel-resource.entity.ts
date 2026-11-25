import { Column, DataType, Default, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { ChannelResourceType } from '../community.types';

@Table({ tableName: 'channel_resources', underscored: true, timestamps: true })
export class ChannelResource extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column({ type: DataType.UUID, allowNull: false })
  channelId!: string;

  @Default('link')
  @Column(DataType.ENUM('link', 'image', 'file'))
  type!: ChannelResourceType;

  @Column({ type: DataType.STRING(200), allowNull: false })
  title!: string;

  @Column({ type: DataType.STRING(2048), allowNull: false })
  url!: string;

  @Column({ type: DataType.STRING(200), allowNull: true })
  source!: string | null;

  @Column({ type: DataType.UUID, allowNull: false })
  sharedByUserId!: string;

  declare createdAt: Date;

  declare updatedAt: Date;
}
