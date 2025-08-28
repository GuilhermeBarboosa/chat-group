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
  message: string = '';
  messages: any[] = [];
  usersOnline: number = 0;
  isConnected = false;
  connectingMessage = 'Connecting';

  constructor(public websocketService: WebsocketService) {}

  ngOnInit() {
    console.log('AppComponent initialized');

    this.websocketService.message$.subscribe((message) => {
      if (message) {
        console.log('New message received:', message);
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

    this.websocketService.users$.subscribe((userCount) => {
      console.log("User count updated:", userCount);
      this.usersOnline = userCount;
    });
  }

  connect() {
    console.log(`Attempting to connect as ${this.username}`);
    this.websocketService.connect(this.username);
  }

  sendMessage() {
    console.log('Message sent');

    if (this.message) {
      this.websocketService.sendMessage(this.username, this.message);
      this.message = '';
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
      // Generate a hash from the sender's name
      hash = 31 * hash + sender.charCodeAt(i);
    }
    // Create a hash based on the username
    // Return a color from the array based on the hash value
    return colors[Math.abs(hash % colors.length)];
  }
}
