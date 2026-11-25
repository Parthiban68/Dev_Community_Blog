import { Column, DataType, Default, Model, PrimaryKey, Table } from 'sequelize-typescript';

@Table({ tableName: 'channel_members', underscored: true, timestamps: true })
export class ChannelMember extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column({ type: DataType.UUID, allowNull: false })
  channelId!: string;

  @Column({ type: DataType.UUID, allowNull: false })
  userId!: string;

  declare createdAt: Date;

  declare updatedAt: Date;
}
