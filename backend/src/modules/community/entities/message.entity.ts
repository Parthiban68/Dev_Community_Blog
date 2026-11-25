import { Column, DataType, Default, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { MessageKind } from '../community.types';

@Table({ tableName: 'messages', underscored: true, timestamps: true })
export class Message extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column({ type: DataType.UUID, allowNull: false })
  channelId!: string;

  @Column({ type: DataType.UUID, allowNull: true })
  parentMessageId!: string | null;

  @Column({ type: DataType.UUID, allowNull: false })
  authorId!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  body!: string;

  @Default('message')
  @Column(DataType.ENUM('message', 'question', 'answer', 'announcement', 'resource'))
  kind!: MessageKind;

  @Column({ type: DataType.TEXT, allowNull: true })
  code!: string | null;

  @Column({ type: DataType.STRING(40), allowNull: true })
  language!: string | null;

  @Column({ type: DataType.STRING(2048), allowNull: true })
  linkUrl!: string | null;

  @Column({ type: DataType.STRING(200), allowNull: true })
  linkTitle!: string | null;

  declare createdAt: Date;

  declare updatedAt: Date;
}
