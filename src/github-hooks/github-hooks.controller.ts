import { Controller, Get, Post } from '@nestjs/common';

@Controller('github-hooks')
export class GithubHooksController {
  @Get('/')
  getHello() {
    return 'hello, github hooks';
  }

  @Post('/')
  handlerWebHooks() {
    // TODO impl it
  }
}
