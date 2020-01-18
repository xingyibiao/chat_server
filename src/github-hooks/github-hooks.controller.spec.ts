import { Test, TestingModule } from '@nestjs/testing';
import { GithubHooksController } from './github-hooks.controller';

describe('GithubHooks Controller', () => {
  let controller: GithubHooksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GithubHooksController],
    }).compile();

    controller = module.get<GithubHooksController>(GithubHooksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return hello', () => {
    expect(controller.getHello()).toBe('hello, github hooks');
  })
});
