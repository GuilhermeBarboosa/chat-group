import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WebsocketService } from './services/websocket.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  providers: [WebsocketService],
})
export class AppComponent implements OnInit {
  title = 'chat-group-front';

  username: string = '';
  users: any[] = [];
  messages: any[] = [];
  usersOnline: number = 0;
  isConnected = false;
  connectingMessage = 'Connecting';
  userConnected = '';
  messageContent: string = '';

  constructor(public websocketService: WebsocketService) {}

  ngOnInit() {
    console.log('AppComponent initialized');

    this.websocketService.message$.subscribe((message) => {
      if (message) {
        console.log('New message received:', message);
        this.userConnected = message.content;
        this.messages.push(message);
      }
    });

    this.websocketService.connectionStatus$.subscribe((status) => {
      this.isConnected = status;
      if (status) {
        this, (this.connectingMessage = '');
        console.log('WebSocket connected');
      } else {
        console.log('WebSocket disconnected');
      }
    });

    this.websocketService.users$.subscribe((count) => {
      this.usersOnline = count;
    });

    this.websocketService.usersList$.subscribe((users) => {
      this.users = users;
    });

    if (localStorage.getItem('username')) {
      this.username = localStorage.getItem('username')!;
      this.websocketService.connect(this.username);
    }
  }

  connect() {
    localStorage.setItem('username', this.username);
    console.log(`Attempting to connect as ${this.username}`);
    this.websocketService.connect(this.username);
  }

  sendMessage() {
    console.log('Message sent');

    if (this.messageContent) {
      this.websocketService.sendMessage(this.username, this.messageContent);

      this.messageContent = '';
    }
  }

  getAvatarColor(sender: string): string {
    // Array of colors to choose from
    const colors = [
      '#2196F3',
      '#32c787',
      '#BCD4',
      '#ff5652',
      '#ffc107',
      '#ff85af',
      '#39bb',
    ];
    let hash = 0;
    for (let i = 0; i < sender.length; i++) {
      hash = 31 * hash + sender.charCodeAt(i);
    }
    return colors[Math.abs(hash % colors.length)];
  }
}
