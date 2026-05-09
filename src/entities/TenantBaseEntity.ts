import { Column } from 'typeorm';
import { BaseEntity } from './BaseEntity';

export abstract class TenantBaseEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  organizationId!: string;
}
