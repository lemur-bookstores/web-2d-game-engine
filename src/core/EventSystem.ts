import { GameEvent, EventCallback } from '../types';

/**
 * Event system for handling game events using the Observer pattern
 */
export class EventSystem {
    private static instance: EventSystem;
    private listeners = new Map<string, EventCallback[]>();
    private eventQueue: GameEvent[] = [];
    private isProcessing = false;

    private constructor() { }

    /**
     * Get the singleton instance of the event system
     */
    static getInstance(): EventSystem {
        if (!EventSystem.instance) {
            EventSystem.instance = new EventSystem();
        }
        return EventSystem.instance;
    }

    /**
     * Emit an event to be processed
     */
    emit(type: string, data: any = null): void {
        const event: GameEvent = {
            type,
            data,
            timestamp: performance.now()
        };

        this.eventQueue.push(event);
    }

    /**
     * Register an event listener
     */
    on(type: string, callback: EventCallback): void {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type)!.push(callback);
    }

    /**
     * Register a one-time event listener
     */
    once(type: string, callback: EventCallback): void {
        const wrappedCallback: EventCallback = (event: GameEvent) => {
            callback(event);
            this.off(type, wrappedCallback);
        };
        this.on(type, wrappedCallback);
    }

    /**
     * Remove an event listener
     */
    off(type: string, callback: EventCallback): void {
        const callbacks = this.listeners.get(type);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * Remove all listeners for a specific event type
     */
    removeAllListeners(type?: string): void {
        if (type) {
            this.listeners.delete(type);
        } else {
            this.listeners.clear();
        }
    }

    /**
     * Check if there are any listeners for an event type
     */
    hasListeners(type: string): boolean {
        const callbacks = this.listeners.get(type);
        return callbacks !== undefined && callbacks.length > 0;
    }

    /**
     * Get the number of listeners for an event type
     */
    listenerCount(type: string): number {
        const callbacks = this.listeners.get(type);
        return callbacks ? callbacks.length : 0;
    }

    /**
     * Process all queued events
     * This should be called once per frame in the game loop
     */
    processEvents(): void {
        if (this.isProcessing) {
            console.warn('EventSystem is already processing events. Recursive call detected.');
            return;
        }

        this.isProcessing = true;

        try {
            while (this.eventQueue.length > 0) {
                const event = this.eventQueue.shift()!;
                this.dispatchEvent(event);
            }
        } catch (error) {
            console.error('Error processing events:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Dispatch an event to all registered listeners
     */
    private dispatchEvent(event: GameEvent): void {
        const callbacks = this.listeners.get(event.type);

        if (callbacks) {
            // Create a copy of the callbacks array to avoid issues if listeners are modified during dispatch
            const callbacksCopy = [...callbacks];

            for (const callback of callbacksCopy) {
                try {
                    callback(event);
                } catch (error) {
                    console.error(`Error in event listener for '${event.type}':`, error);
                }
            }
        }
    }

    /**
     * Emit an event immediately without queuing (use with caution)
     */
    emitImmediate(type: string, data: any = null): void {
        const event: GameEvent = {
            type,
            data,
            timestamp: performance.now()
        };

        this.dispatchEvent(event);
    }

    /**
     * Clear all queued events
     */
    clearQueue(): void {
        this.eventQueue = [];
    }

    /**
     * Get the current number of queued events
     */
    getQueueLength(): number {
        return this.eventQueue.length;
    }

    /**
     * Debug method to list all registered event types
     */
    getRegisteredEventTypes(): string[] {
        return Array.from(this.listeners.keys());
    }

    /**
     * Debug method to get detailed listener information
     */
    getDebugInfo(): { [eventType: string]: number } {
        const info: { [eventType: string]: number } = {};
        for (const [eventType, callbacks] of this.listeners) {
            info[eventType] = callbacks.length;
        }
        return info;
    }
}
