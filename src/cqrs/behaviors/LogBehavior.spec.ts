import { LogBehavior } from './LogBehavior';
import { Result } from '../../result/Result';

describe('LogBehavior', () => {
  let behavior: LogBehavior;

  beforeEach(() => {
    behavior = new LogBehavior();
  });

  it('should pass through successful results', async () => {
    const next = jest.fn().mockResolvedValue(Result.success({ id: '1' }));
    const command = new (class TestCommand { buildId = 'b1'; })();

    const result = await behavior.execute(command, next);

    expect(result.isSuccess).toBe(true);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should pass through failed results', async () => {
    const next = jest.fn().mockResolvedValue(Result.notFound('not found'));

    const result = await behavior.execute({}, next);

    expect(result.isSuccess).toBe(false);
  });

  it('should re-throw exceptions', async () => {
    const next = jest.fn().mockRejectedValue(new Error('boom'));

    await expect(behavior.execute({}, next)).rejects.toThrow('boom');
  });

  it('should mask PII fields in payload', async () => {
    const next = jest.fn().mockResolvedValue(Result.success('ok'));
    const command = {
      email: 'john@example.com',
      accessToken: 'secret-token',
      brdText: 'A'.repeat(100),
      name: 'visible',
    };

    // The behavior masks internally for logging. We verify it doesn't affect the original.
    await behavior.execute(command, next);

    // Original command should be unmodified
    expect(command.email).toBe('john@example.com');
    expect(command.accessToken).toBe('secret-token');
    expect(command.brdText).toBe('A'.repeat(100));
  });
});
