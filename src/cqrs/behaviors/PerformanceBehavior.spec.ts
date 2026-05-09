import { PerformanceBehavior } from './PerformanceBehavior';
import { Result } from '../../result/Result';

describe('PerformanceBehavior', () => {
  it('should pass through results and record metrics', async () => {
    const observe = jest.fn();
    const metrics = {
      handlerDuration: {
        labels: jest.fn().mockReturnValue({ observe }),
      },
    };
    const behavior = new PerformanceBehavior(metrics as any);
    const next = jest.fn().mockResolvedValue(Result.success('ok'));

    class TestCommand {}
    const result = await behavior.execute(new TestCommand(), next);

    expect(result.isSuccess).toBe(true);
    expect(metrics.handlerDuration.labels).toHaveBeenCalledWith('TestCommand', 'success');
    expect(observe).toHaveBeenCalled();
  });

  it('should record failure label for failed results', async () => {
    const observe = jest.fn();
    const metrics = {
      handlerDuration: {
        labels: jest.fn().mockReturnValue({ observe }),
      },
    };
    const behavior = new PerformanceBehavior(metrics as any);
    const next = jest.fn().mockResolvedValue(Result.notFound('nope'));

    class FailCommand {}
    await behavior.execute(new FailCommand(), next);

    expect(metrics.handlerDuration.labels).toHaveBeenCalledWith('FailCommand', 'failure');
  });

  it('should work without metrics service', async () => {
    const behavior = new PerformanceBehavior(undefined);
    const next = jest.fn().mockResolvedValue(Result.success('ok'));

    class NoMetrics {}
    const result = await behavior.execute(new NoMetrics(), next);

    expect(result.isSuccess).toBe(true);
  });
});
