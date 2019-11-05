import { SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';

type UserInfo = {
  sessionId: string,
  userName: string,
  roomName: string,
}

@WebSocketGateway({ transports: ['websocket'] })
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Server;

  private roomMap: Map<string, UserInfo[]> = new Map();

  handleConnection(client: Socket) {
    console.log('加入网关', client.id)
  }

  handleDisconnect(client: Socket) {
    console.log('离开网关', client.id)
    this.roomMap.forEach((room, key) => {
      room.forEach((user, i) => {
        if (user.sessionId === client.id) {
          const users = this.roomMap.get(key)
          this.roomMap.set(key, users.splice(i, 1))
          console.log(this.roomMap)
        }
      })
    })
  }

  private getUserInfoBySId(sessionId: string) {
    let sender: string;
    let roomName: string;
    this.roomMap.forEach((room, key) => {
      room.forEach((user) => {
        if (user.sessionId === sessionId) {
          sender = user.userName;
          roomName = key;
        }
      })
    })

    return {
      sender,
      roomName,
    }
  }

  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): string {
    return 'Hello world!';
  }

  @SubscribeMessage('login')
  handlerLogin(client: Socket, payload: any): boolean {
    const [userName, roomName] = payload;
    try {
      client.join(roomName);
      const userRoom = this.roomMap.get(roomName);
      const isPublisher = Array.isArray(userRoom) && userRoom.length > 0;
      const room = this.roomMap.get(roomName)
      const user: UserInfo = {
        sessionId: client.id,
        userName,
        roomName,
      }
      if (room) {
        room.push(user)
      } else {
        this.roomMap.set(roomName, [user])
      }
      console.log(isPublisher);
      return isPublisher;

    } catch(e) {
      console.error(e)
    }
  }

  @SubscribeMessage('send_sdp')
  handlerSdpMsg(client: Socket, data: any) {
    const { sender, roomName } = this.getUserInfoBySId(client.id);

    if (!sender) return;
    client.to(roomName).emit('send_sdp', { data, sender });
  }

  @SubscribeMessage('candidate')
  handlerCandidateMsg(client: Socket, data: any) {
    const { sender, roomName } = this.getUserInfoBySId(client.id);

    if (!sender) return;
    client.to(roomName).emit('candidate', { data, sender });
  }

  @SubscribeMessage('call')
  handlerCall(client: Socket, data: any) {
    const { sender, roomName } = this.getUserInfoBySId(client.id);

    if (!sender) return;
    client.to(roomName).emit('call', { sender });
  }

  @SubscribeMessage('chat')
  handlerChat(client: Socket, msg: string) {
    const { sender, roomName } = this.getUserInfoBySId(client.id);

    if (!sender) return;
    client.to(roomName).emit('chat', msg);
    return msg;
  }
}
