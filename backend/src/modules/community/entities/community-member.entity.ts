import { Column, DataType, Default, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { CommunityRole } from '../community.types';

@Table({ tableName: 'community_members', underscored: true, timestamps: true })
export class CommunityMember extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column({ type: DataType.UUID, allowNull: false })
  communityId!: string;

  @Column({ type: DataType.UUID, allowNull: false })
  userId!: string;

  @Default('member')
  @Column(DataType.ENUM('owner', 'admin', 'moderator', 'member'))
  role!: CommunityRole;

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  joinedAt!: Date;

  declare createdAt: Date;

  declare updatedAt: Date;
}
