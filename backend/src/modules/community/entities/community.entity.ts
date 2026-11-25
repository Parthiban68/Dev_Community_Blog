import { Column, DataType, Default, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { CommunityVisibility } from '../community.types';

@Table({ tableName: 'communities', underscored: true, timestamps: true })
export class Community extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column({ type: DataType.STRING(120), allowNull: false })
  name!: string;

  @Column({ type: DataType.STRING(140), allowNull: false, unique: true })
  slug!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  description!: string | null;

  @Column({ type: DataType.STRING(2048), allowNull: true })
  coverImageUrl!: string | null;

  @Default('public')
  @Column(DataType.ENUM('public', 'private'))
  visibility!: CommunityVisibility;

  declare createdAt: Date;

  declare updatedAt: Date;
}
