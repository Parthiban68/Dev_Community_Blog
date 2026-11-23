import { Column, DataType, Default, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { User } from './user.entity';

@Table({ tableName: 'auth_sessions', underscored: true })
export class AuthSession extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  userId!: string;

  @Column({ type: DataType.UUID, allowNull: false })
  familyId!: string;

  @Column({ type: DataType.CHAR(64), allowNull: false, unique: true })
  refreshTokenHash!: string;

  @Column({ type: DataType.DATE, allowNull: false })
  expiresAt!: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  revokedAt!: Date | null;

  declare createdAt: Date;

  declare updatedAt: Date;
}
