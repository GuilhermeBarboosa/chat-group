import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Client, Message } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  stompClient: Client | null = null;

  private messageSubject = new BehaviorSubject<any>(null);
  public message$ = this.messageSubject.asObservable();

  private usersSubject = new BehaviorSubject<any>(null);
  public users$ = this.usersSubject.asObservable();

  private usersListSubject = new BehaviorSubject<any>(null);
  public usersList$ = this.usersListSubject.asObservable();

  private connectionSubject = new BehaviorSubject<boolean>(false);
  public connectionStatus$ = this.connectionSubject.asObservable();

  connect(username: string) {
    const socket = new SockJS('http://localhost:8080/ws');

    this.stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      debug: (str) => {
        console.log(str);
      },
    });

    this.stompClient.onConnect = (frame) => {
      console.log('Connected: ' + frame);
      this.connectionSubject.next(true);

      // Subscribe to users count
      this.stompClient?.subscribe('/topic/users', (msg) => {
        this.usersSubject.next(Number(msg.body));
      });

      this.stompClient?.subscribe('/topic/users/list', (msg) => {
        this.usersListSubject.next(JSON.parse(msg.body));
      });

      // Subscribe to public chat
      this.stompClient?.subscribe('/topic/public', (message) => {
        const msg = JSON.parse(message.body);
        this.messageSubject.next(msg);

        // Só após receber confirmação de que o usuário entrou
        if (msg.type === 'JOIN' && msg.sender === username) {
          this.stompClient?.publish({ destination: '/app/chat.size' });
          this.stompClient?.publish({ destination: '/app/chat.list.users' });
        }
      });

      // Publish addUser
      this.stompClient?.publish({
        destination: '/app/chat.addUser',
        body: JSON.stringify({ sender: username, type: 'JOIN' }),
      });
    };

    // this.stompClient.onStompError = (frame) => {
    //   console.error('Broker error: ' + frame);
    //   console.error('Additional details: ' + frame.body);
    // };

    this.stompClient?.activate();

    window.addEventListener('beforeunload', () => {
      this.stompClient?.publish({ destination: '/app/chat.leave' });

      this.stompClient?.deactivate();
    });
  }

  sendMessage(username: string, content: string) {
    if (this.stompClient && this.stompClient.connected) {
      const chatMessage = { sender: username, content: content, type: 'CHAT' };

      console.log(`Message sent by ${username}: ${content}`);

      this.stompClient.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(chatMessage),
      });
    } else {
      console.warn(`Unable to send message, WebSocket is not connected.`);
    }
  }

  disconnect() {
    if (this.stompClient) {
      this.stompClient.deactivate();
    }
  }
}
