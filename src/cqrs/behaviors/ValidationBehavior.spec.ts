import { z } from 'zod';
import { ValidationBehavior } from './ValidationBehavior';
import { Result, ErrorType } from '../../result/Result';
import { Validate } from '../decorators/Validate.decorator';
import { ICommandValidator, validateCommand } from '../validation/ICommandValidator';

// --- Validator classes ---

class BlockUserValidator implements ICommandValidator<BlockUserCommand> {
  private schema = z
    .object({
      blockerId: z.string().min(1, 'blockerId is required'),
      blockedUserId: z.string().min(1, 'blockedUserId is required'),
    })
    .refine((d) => d.blockerId !== d.blockedUserId, {
      message: 'Cannot block yourself',
    });

  validate(command: BlockUserCommand): Result<void> {
    return validateCommand(this.schema, command);
  }
}

class NameValidator implements ICommandValidator<ValidatedCommand> {
  private schema = z.object({
    name: z.string().min(5, 'Name must be at least 5 characters'),
  });

  validate(command: ValidatedCommand): Result<void> {
    return validateCommand(this.schema, command);
  }
}

// --- Commands ---

@Validate(NameValidator)
class ValidatedCommand {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}

@Validate(BlockUserValidator)
class BlockUserCommand {
  constructor(
    public readonly blockerId: string,
    public readonly blockedUserId: string,
  ) {}
}

class UnvalidatedCommand {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}

describe('ValidationBehavior', () => {
  let behavior: ValidationBehavior;
  const next = jest.fn().mockResolvedValue(Result.success('ok'));

  beforeEach(() => {
    behavior = new ValidationBehavior();
    next.mockClear();
  });

  it('should pass through when command has no @Validate decorator', async () => {
    const result = await behavior.execute(new UnvalidatedCommand('hi'), next);

    expect(result.isSuccess).toBe(true);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should pass through when validation succeeds', async () => {
    const result = await behavior.execute(new ValidatedCommand('hello'), next);

    expect(result.isSuccess).toBe(true);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should return validation error when validation fails', async () => {
    const result = await behavior.execute(new ValidatedCommand('hi'), next);

    expect(result.isSuccess).toBe(false);
    expect(result.errorType).toBe(ErrorType.ValidationError);
    expect(result.errorMessage).toContain('at least 5 characters');
    expect(next).not.toHaveBeenCalled();
  });

  it('should support conditional validation with refine', async () => {
    const result = await behavior.execute(new BlockUserCommand('user-1', 'user-1'), next);

    expect(result.isSuccess).toBe(false);
    expect(result.errorType).toBe(ErrorType.ValidationError);
    expect(result.errorMessage).toContain('Cannot block yourself');
    expect(next).not.toHaveBeenCalled();
  });

  it('should pass valid block user command', async () => {
    const result = await behavior.execute(new BlockUserCommand('user-1', 'user-2'), next);

    expect(result.isSuccess).toBe(true);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should report missing required fields', async () => {
    const result = await behavior.execute(new BlockUserCommand('', 'user-2'), next);

    expect(result.isSuccess).toBe(false);
    expect(result.errorMessage).toContain('blockerId');
    expect(next).not.toHaveBeenCalled();
  });
});
