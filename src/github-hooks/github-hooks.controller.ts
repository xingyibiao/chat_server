import { Controller, Get, Post, Req, Response } from '@nestjs/common';
import { createHmac } from 'crypto';
import bl  = require('bl');
import * as path from 'path';
import { spawn } from 'child_process';

const SECRET = 'gayhub';
const SHELL_PATH = path.join('/root/blog', 'deploy.sh');

@Controller('github-hooks')
export class GithubHooksController {
  @Get('/')
  getHello() {
    return 'hello, github hooks';
  }

  @Post('/')
  handlerWebHooks(@Req() req, @Response() res) {
    // TODO impl it
    const { headers } = req;
    const delivery = headers['x-github-delivery'];
    const signature = headers['x-hub-signature'];
    const event = headers['x-github-event'];
    const ua = headers['user-agent'];
    if (!delivery || !signature || !event || !ua.includes('GitHub-Hookshot')) {
      return this.handlerError(res, 'not Auth');
    }

    const [signType, signData] = signature.split('=');
    req.pipe(new bl((error, data) => {
      if (error) {
        return this.handlerError(res, 'server error');
      }

      if (signData !== this.sign(signType, data, SECRET)) {
        return this.handlerError(res, 'not Auth');
      }

      res.writeHead(200, { 'content-type': 'application/json' });
      res.send({ ok: true });

      if (event === 'push') {
        this.deploy(req.body.repository);
      }
    }));
    // if (signData === this.sign(signType, ))
  }

  private handlerError(@Response() res, msg: string) {
    res.status(400);
    res.send(msg);
  }

  private sign(type: string, data: Buffer, secret: string) {
    return createHmac(type, secret).update(data).digest('hex');
  }

  private deploy(repository: string) {
    if (!repository) {
      return;
    }
    const [userName, repositoryName] = repository.split('/');
    if (repositoryName === 'blog') {
      console.log('deloy blog start');
      this.deployBlog();
    }
  }

  private deployBlog() {
    this.runCmd('sh', [SHELL_PATH]);
  }

  private runCmd(cmd: string, args: string[]) {
    return new Promise((resolve, reject) => {
      const shell = spawn(cmd, args);
      shell.stderr.on('data', (e) => console.error(e));
      shell.on('close', (code) => {
        if (code !== 0) {
          console.error(`${cmd} ${args} error, code: ${code}`);
          reject(code);
          return;
        }
        resolve(code);
      });
    });
  }
}