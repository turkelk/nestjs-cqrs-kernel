"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockRepository = createMockRepository;
exports.createMockRedisClient = createMockRedisClient;
/**
 * Creates a mock repository with common TypeORM repository methods stubbed.
 */
function createMockRepository() {
    return {
        find: jest.fn(),
        findOne: jest.fn(),
        findOneBy: jest.fn(),
        findAndCount: jest.fn(),
        save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
        create: jest.fn().mockImplementation((dto) => dto),
        update: jest.fn(),
        delete: jest.fn(),
        remove: jest.fn(),
        count: jest.fn(),
        createQueryBuilder: jest.fn(() => ({
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            addOrderBy: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([]),
            getOne: jest.fn().mockResolvedValue(null),
            getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
        })),
        manager: {
            transaction: jest.fn().mockImplementation((cb) => cb({
                save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
                findOne: jest.fn(),
            })),
        },
    };
}
/**
 * Creates a mock Redis client with common ioredis methods stubbed.
 */
function createMockRedisClient() {
    const client = {
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue('OK'),
        del: jest.fn().mockResolvedValue(1),
        setex: jest.fn().mockResolvedValue('OK'),
        exists: jest.fn().mockResolvedValue(0),
        xadd: jest.fn().mockResolvedValue('1-0'),
        xreadgroup: jest.fn().mockResolvedValue(null),
        xack: jest.fn().mockResolvedValue(1),
        xgroup: jest.fn().mockResolvedValue('OK'),
        quit: jest.fn().mockResolvedValue('OK'),
        disconnect: jest.fn(),
        on: jest.fn().mockReturnThis(),
        duplicate: jest.fn(),
    };
    // duplicate() returns a fresh mock with the same shape
    client.duplicate.mockImplementation(() => createMockRedisClient());
    return client;
}
