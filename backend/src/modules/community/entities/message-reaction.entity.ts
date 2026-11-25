import { Column, DataType, Default, Model, PrimaryKey, Table } from 'sequelize-typescript';

@Table({ tableName: 'message_reactions', underscored: true, timestamps: true })
export class MessageReaction extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column({ type: DataType.UUID, allowNull: false })
  messageId!: string;

  @Column({ type: DataType.UUID, allowNull: false })
  userId!: string;

  @Column({ type: DataType.STRING(16), allowNull: false })
  emoji!: string;

  declare createdAt: Date;

  declare updatedAt: Date;
}
