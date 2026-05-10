import { WorkflowBehavior } from './WorkflowBehavior';
import { Workflow } from '../decorators/Workflow.decorator';
import { Result } from '../../result/Result';
import { WorkflowEngine, WorkflowStartResult } from '../interfaces/WorkflowEngine';

const mockEngine: jest.Mocked<WorkflowEngine> = {
  startProcess: jest.fn(),
  signalProcess: jest.fn(),
  abortProcess: jest.fn(),
};

@Workflow('onboarding-process')
class DecoratedCommand {
  constructor(public readonly userId: string) {}
}

@Workflow('guarded-process', { fallback: 'skip' })
class SkipFallbackCommand {
  constructor(public readonly id: string) {}
}

class PlainCommand {
  constructor(public readonly id: string) {}
}

describe('WorkflowBehavior', () => {
  let behavior: WorkflowBehavior;
  let next: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    behavior = new WorkflowBehavior(mockEngine);
    next = jest.fn().mockResolvedValue(Result.success({ done: true }));
  });

  it('passes through commands without @Workflow decorator', async () => {
    const cmd = new PlainCommand('123');
    const result = await behavior.execute(cmd, next);

    expect(next).toHaveBeenCalled();
    expect(result.isSuccess).toBe(true);
    expect(mockEngine.startProcess).not.toHaveBeenCalled();
  });

  it('short-circuits decorated commands and starts a process', async () => {
    const startResult: WorkflowStartResult = {
      workflowInstanceId: 'wf-1',
      processInstanceId: 'pi-1',
      status: 'STARTED',
    };
    mockEngine.startProcess.mockResolvedValue(startResult);

    const cmd = new DecoratedCommand('user-42');
    const result = await behavior.execute(cmd, next);

    expect(next).not.toHaveBeenCalled();
    expect(mockEngine.startProcess).toHaveBeenCalledWith(
      'onboarding-process',
      cmd,
      { commandType: 'DecoratedCommand' },
    );
    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual(startResult);
  });

  it('passes through when context has workflow-phase=execute', async () => {
    const cmd = new DecoratedCommand('user-42');
    const context = new Map<string, unknown>([['workflow-phase', 'execute']]);

    const result = await behavior.execute(cmd, next, context);

    expect(next).toHaveBeenCalled();
    expect(mockEngine.startProcess).not.toHaveBeenCalled();
    expect(result.isSuccess).toBe(true);
  });

  it('passes through when no WorkflowEngine is injected', async () => {
    const behaviorNoEngine = new WorkflowBehavior(undefined);
    const cmd = new DecoratedCommand('user-42');

    const result = await behaviorNoEngine.execute(cmd, next);

    expect(next).toHaveBeenCalled();
    expect(result.isSuccess).toBe(true);
  });

  it('applies fallback throw on engine error', async () => {
    mockEngine.startProcess.mockRejectedValue(new Error('connection refused'));

    const cmd = new DecoratedCommand('user-42');
    const result = await behavior.execute(cmd, next);

    expect(next).not.toHaveBeenCalled();
    expect(result.isSuccess).toBe(false);
    expect(result.errorMessage).toContain('Workflow start failed');
    expect(result.errorMessage).toContain('connection refused');
  });

  it('applies fallback skip on engine error (calls next)', async () => {
    mockEngine.startProcess.mockRejectedValue(new Error('timeout'));

    const cmd = new SkipFallbackCommand('123');
    const result = await behavior.execute(cmd, next);

    expect(next).toHaveBeenCalled();
    expect(result.isSuccess).toBe(true);
  });
});
