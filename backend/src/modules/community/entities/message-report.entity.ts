import { Column, DataType, Default, Model, PrimaryKey, Table } from 'sequelize-typescript';

@Table({ tableName: 'message_reports', underscored: true, timestamps: true })
export class MessageReport extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column({ type: DataType.UUID, allowNull: false })
  messageId!: string;

  @Column({ type: DataType.UUID, allowNull: false })
  reporterUserId!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  reason!: string;

  declare createdAt: Date;

  declare updatedAt: Date;
}
