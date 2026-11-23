import { Column, DataType, Default, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { User } from './user.entity';

@Table({ tableName: 'password_reset_tokens', underscored: true })
export class PasswordResetToken extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  userId!: string;

  @Column({ type: DataType.CHAR(64), allowNull: false, unique: true })
  tokenHash!: string;

  @Column({ type: DataType.DATE, allowNull: false })
  expiresAt!: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  usedAt!: Date | null;

  declare createdAt: Date;

  declare updatedAt: Date;
}
