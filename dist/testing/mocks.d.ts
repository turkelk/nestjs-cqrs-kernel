/**
 * Creates a mock repository with common TypeORM repository methods stubbed.
 */
export declare function createMockRepository<T = any>(): {
    find: jest.Mock<any, any, any>;
    findOne: jest.Mock<any, any, any>;
    findOneBy: jest.Mock<any, any, any>;
    findAndCount: jest.Mock<any, any, any>;
    save: jest.Mock<any, any, any>;
    create: jest.Mock<any, any, any>;
    update: jest.Mock<any, any, any>;
    delete: jest.Mock<any, any, any>;
    remove: jest.Mock<any, any, any>;
    count: jest.Mock<any, any, any>;
    createQueryBuilder: jest.Mock<{
        where: jest.Mock<any, any, any>;
        andWhere: jest.Mock<any, any, any>;
        orderBy: jest.Mock<any, any, any>;
        addOrderBy: jest.Mock<any, any, any>;
        take: jest.Mock<any, any, any>;
        skip: jest.Mock<any, any, any>;
        leftJoinAndSelect: jest.Mock<any, any, any>;
        getMany: jest.Mock<any, any, any>;
        getOne: jest.Mock<any, any, any>;
        getManyAndCount: jest.Mock<any, any, any>;
    }, [], any>;
    manager: {
        transaction: jest.Mock<any, any, any>;
    };
};
/**
 * Creates a mock Redis client with common ioredis methods stubbed.
 */
export declare function createMockRedisClient(): Record<string, jest.Mock<any, any, any>>;
//# sourceMappingURL=mocks.d.ts.map