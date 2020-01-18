import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SocketModule } from './socket/socket.module';
import { GithubHooksController } from './github-hooks/github-hooks.controller';

@Module({
  imports: [SocketModule],
  controllers: [AppController, GithubHooksController],
  providers: [AppService],
})
export class AppModule {}
