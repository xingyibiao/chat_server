import { Test, TestingModule } from '@nestjs/testing';
import bl = require('bl');
import { Readable } from 'stream';

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
  });

  it('test sign', () => {
    const payload = {
      foo: 'bar',
    };
    const signRes = controller.sign(JSON.stringify(payload), 'mysecret');
    expect(signRes).toBe('d03207e4b030cf234e3447bac4d93add4c6643d8');
  });

  it ('test verify', () => {
    const payload = {
      foo: 'bar',
    };

    expect(controller.verify('mysecret', payload, 'sha1=d03207e4b030cf234e3447bac4d93add4c6643d8')).toBe(true);
  });

  // it('test run cmd', async () => {
  //   const result = await controller.runCmd('echo', ['hello']);
  //   expect(result).toBe(0);
  // });
});
