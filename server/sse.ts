import type { Response } from 'express';

interface SSEClient {
  id: string;
  userId?: string;
  res: Response;
}

class SSEManager {
  private clients: SSEClient[] = [];

  public addClient(id: string, res: Response, userId?: string) {
    this.clients.push({ id, res, userId });

    // Send initial handshake
    res.write(`data: ${JSON.stringify({ type: 'connected', clientId: id, timestamp: new Date().toISOString() })}\n\n`);

    // Ping interval to keep connection alive through any intermediate proxy
    const pingInterval = setInterval(() => {
      try {
        res.write(`:ping\n\n`);
      } catch {
        clearInterval(pingInterval);
      }
    }, 20000);

    res.on('close', () => {
      clearInterval(pingInterval);
      this.removeClient(id);
    });
  }

  public removeClient(id: string) {
    this.clients = this.clients.filter(c => c.id !== id);
  }

  public broadcast(event: { type: string; payload: unknown }) {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of this.clients) {
      try {
        client.res.write(data);
      } catch (err) {
        console.error('Error writing to client:', err);
      }
    }
  }

  public sendToUser(userId: string, event: { type: string; payload: unknown }) {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of this.clients) {
      if (client.userId === userId) {
        try {
          client.res.write(data);
        } catch (err) {
          console.error(`Error writing to user ${userId}:`, err);
        }
      }
    }
  }

  public getConnectedCount(): number {
    return this.clients.length;
  }
}

export const sse = new SSEManager();
