import { Client } from '@stomp/stompjs';
import { BASE_URL } from './apiClient';

const getWsUrl = () => {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  const wsProtocol = BASE_URL.startsWith('https') ? 'wss' : 'ws';
  return `${BASE_URL.replace(/^https?/, wsProtocol)}/ws`;
};

export class TripSocketManager {
  constructor(tripId, onEvent, onStatusChange) {
    this.tripId = tripId;
    this.onEvent = onEvent;
    this.onStatusChange = onStatusChange;
    this.client = null;
    this.subscription = null;
  }

  connect() {
    if (this.client && this.client.active) return;

    this.onStatusChange?.('connecting');

    this.client = new Client({
      brokerURL: getWsUrl(),
      reconnectDelay: 3000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        this.onStatusChange?.('connected');
        this.subscription = this.client.subscribe(`/topic/trips/${this.tripId}`, (message) => {
          try {
            const data = JSON.parse(message.body);
            this.onEvent?.(data);
          } catch (e) {
            console.error('Failed to parse STOMP message:', e);
          }
        });
      },
      onDisconnect: () => {
        this.onStatusChange?.('disconnected');
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        this.onStatusChange?.('error');
      },
      onWebSocketClose: () => {
        this.onStatusChange?.('disconnected');
      },
      onWebSocketError: () => {
        this.onStatusChange?.('error');
      }
    });

    this.client.activate();
  }

  disconnect() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    this.onStatusChange?.('disconnected');
  }
}
