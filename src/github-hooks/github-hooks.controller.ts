import { Controller, Get, Post, Req, Response } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
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
    const { headers } = req;
    const delivery = headers['x-github-delivery'];
    const signature = headers['x-hub-signature'];
    const event = headers['x-github-event'];
    const ua = headers['user-agent'];

    if (event === 'ping') {
      res.status(204);
      res.end();
      return;
    }

    if (!delivery || !signature || !event || !ua.includes('GitHub-Hookshot')) {
      return this.handlerError(res, 'not Auth');
    }

    console.log('start verify');
    if (!this.verify(SECRET, req.body, signature)) {
      console.log('verify error');
      return this.handlerError(res, 'not Auth');
    }
    console.log('verify success');

    res.writeHead(200, { 'content-type': 'application/json' });
    res.end({ ok: true });

    if (event === 'push') {
      this.deploy(req.body.repository);
    }
  }

  private handlerError(@Response() res, msg: string) {
    res.status(400);
    res.send(msg);
  }

  public verify(secret: string, payload: object | string, signature: string) {
    const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const signatureBuffer = Buffer.from(signature);
    const verifyBuffer = Buffer.from(`sha1=${this.sign(data, secret)}`);
    if (signatureBuffer.length !== verifyBuffer.length) {
      return false;
    }

    return timingSafeEqual(signatureBuffer, verifyBuffer);
  }

  public sign( data: string, secret: string) {
    return createHmac('sha1', secret).update(data).digest('hex');
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
    this.runCmd('sh', [SHELL_PATH])
      .then(() => console.log('部署博客成功'))
      .catch((e) => console.log('部署日志失败', e.toString()));
  }

  public runCmd(cmd: string, args: string[]) {
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
