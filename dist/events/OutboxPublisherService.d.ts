import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RedisStreamPublisher } from './RedisStreamPublisher';
export declare class OutboxPublisherService implements OnModuleInit, OnModuleDestroy {
    private readonly dataSource;
    private readonly redisPublisher;
    private readonly logger;
    private timer;
    private processing;
    constructor(dataSource: DataSource, redisPublisher: RedisStreamPublisher);
    onModuleInit(): void;
    onModuleDestroy(): void;
    private pollAndPublish;
}
