import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum OutboxEventStatus {
  Pending = 'Pending',
  Published = 'Published',
  Failed = 'Failed',
}

@Entity('outbox_events')
@Index('idx_outbox_pending', ['status', 'createdAt'], {
  where: `"status" = 'Pending'`,
})
export class OutboxEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  eventType!: string;

  @Column({ type: 'varchar' })
  aggregateId!: string;

  @Column({ type: 'varchar' })
  streamKey!: string;

  @Column({ type: 'jsonb' })
  payload!: Record<string, unknown>;

  @Column({ type: 'uuid', nullable: true })
  organizationId!: string | null;

  @Column({
    type: 'enum',
    enum: OutboxEventStatus,
    default: OutboxEventStatus.Pending,
  })
  status!: OutboxEventStatus;

  @Column({ type: 'int', default: 0 })
  publishAttempts!: number;

  @Column({ type: 'varchar', nullable: true })
  lastError!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;
}
