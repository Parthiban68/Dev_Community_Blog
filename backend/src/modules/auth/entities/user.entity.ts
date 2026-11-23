import { Column, DataType, Default, Model, PrimaryKey, Table } from 'sequelize-typescript';

export type UserStatus = 'active' | 'disabled' | 'suspended';

@Table({ tableName: 'users', underscored: true })
export class User extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column({ type: DataType.STRING(30), allowNull: false, unique: true })
  username!: string;

  @Column({ type: DataType.STRING(254), allowNull: false, unique: true })
  email!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  passwordHash!: string | null;

  @Column({ type: DataType.STRING(80), allowNull: false })
  displayName!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  bio!: string | null;

  @Column({ type: DataType.STRING(2048), allowNull: true })
  avatarUrl!: string | null;

  @Default('active')
  @Column(DataType.ENUM('active', 'disabled', 'suspended'))
  status!: UserStatus;

  @Column({ type: DataType.DATE, allowNull: true })
  emailVerifiedAt!: Date | null;

  @Default(false)
  @Column(DataType.BOOLEAN)
  onboardingCompleted!: boolean;

  declare createdAt: Date;

  declare updatedAt: Date;
}
