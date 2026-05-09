import { CacheBehavior } from './CacheBehavior';
import { Result } from '../../result/Result';
import { Cache } from '../decorators/Cache.decorator';

@Cache('test:{id}', { ttlSeconds: 60 })
class CachedQuery {
  constructor(public readonly id: string) {}
}

class UncachedQuery {
  constructor(public readonly id: string) {}
}

describe('CacheBehavior', () => {
  let redis: { get: jest.Mock; set: jest.Mock };
  let behavior: CacheBehavior;
  const next = jest.fn();

  beforeEach(() => {
    redis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
    };
    behavior = new CacheBehavior(redis as any);
    next.mockReset().mockResolvedValue(Result.success({ data: 'fresh' }));
  });

  it('should skip cache for commands without @Cache decorator', async () => {
    const result = await behavior.execute(new UncachedQuery('1'), next);

    expect(result.isSuccess).toBe(true);
    expect(redis.get).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should return cached value on cache hit', async () => {
    redis.get.mockResolvedValue(JSON.stringify({ data: 'cached' }));

    const result = await behavior.execute(new CachedQuery('abc'), next);

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual({ data: 'cached' });
    expect(next).not.toHaveBeenCalled();
    expect(redis.get).toHaveBeenCalledWith('test:abc');
  });

  it('should call handler and cache result on cache miss', async () => {
    const result = await behavior.execute(new CachedQuery('abc'), next);

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual({ data: 'fresh' });
    expect(next).toHaveBeenCalledTimes(1);
    expect(redis.set).toHaveBeenCalledWith('test:abc', JSON.stringify({ data: 'fresh' }), 'EX', 60);
  });

  it('should skip cache when redis is not available', async () => {
    const noCacheBehavior = new CacheBehavior(undefined);
    const result = await noCacheBehavior.execute(new CachedQuery('1'), next);

    expect(result.isSuccess).toBe(true);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
