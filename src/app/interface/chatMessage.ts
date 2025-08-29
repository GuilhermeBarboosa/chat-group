interface ChatMessage {
  sender: string;
  content: string;
  room: string; // opcional para múltiplas salas
  type: string;
}
