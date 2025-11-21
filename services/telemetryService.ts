import { Platform } from '../types';

export type EventName = 'CAMPAIGN_GENERATED' | 'POST_SCHEDULED' | 'IMAGE_DOWNLOADED';

interface TelemetryEvent {
  timestamp: number;
  event: EventName;
  metadata: Record<string, any>;
  sessionId: string;
}

class TelemetryObserver {
  private queue: TelemetryEvent[] = [];
  private readonly FLUSH_THRESHOLD = 5;

  public track(event: EventName, metadata: Record<string, any> = {}) {
    const payload: TelemetryEvent = {
      timestamp: Date.now(),
      event,
      metadata,
      sessionId: this.getSessionId()
    };

    this.queue.push(payload);
    console.debug(`[TELEMETRY] <${event}>`, payload);

    if (this.queue.length >= this.FLUSH_THRESHOLD) {
      this.flush();
    }
  }

  private flush() {
    // Pretend to send to DataDog / Splunk
    console.log(`[NETWORK] Flushing ${this.queue.length} events to data lake...`);
    this.queue = [];
  }

  private getSessionId() {
    // In a real app, this would be persistent for the session lifecycle
    return 'sess_' + Math.random().toString(36).substr(2, 9);
  }
}

export const analytics = new TelemetryObserver();