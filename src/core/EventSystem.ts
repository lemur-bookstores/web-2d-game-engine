

/**
 * Event system for handling game events using the Observer pattern
 */
export class EventSystem {
    private static instance: EventSystem;
    private listeners = new Map<AllEventTypes, EventCallback<any>[]>();
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
    emit<T>(type: AllEventTypes & T, data: any = null): void {
        // console.log(`[EventSystem] Emitting event: ${type}`, data);
        const event: GameEvent = {
            type,
            data,
            timestamp: performance.now()
        };

        // In test environment, process events immediately for synchronous testing
        if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
            this.dispatchEvent(event);
        } else {
            this.eventQueue.push(event);
        }
    }

    /**
     * Register an event listener
     */
    on<T = any>(type: AllEventTypes, callback: EventCallback<T>): void {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type)!.push(callback);
    }

    /**
     * Register a one-time event listener
     */
    once<T = any>(type: AllEventTypes, callback: EventCallback<T>): void {
        const wrappedCallback: EventCallback<T> = (event: GameEvent<T>) => {
            callback(event);
            this.off(type, wrappedCallback);
        };
        this.on(type, wrappedCallback);
    }

    /**
     * Remove an event listener
     */
    off<T = any>(type: AllEventTypes, callback: EventCallback<T>): void {
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
    removeAllListeners(type?: AllEventTypes): void {
        if (type) {
            this.listeners.delete(type);
        } else {
            this.listeners.clear();
        }
    }

    /**
     * Check if there are any listeners for an event type
     */
    hasListeners(type: AllEventTypes): boolean {
        const callbacks = this.listeners.get(type);
        return callbacks !== undefined && callbacks.length > 0;
    }

    /**
     * Get the number of listeners for an event type
     */
    listenerCount(type: AllEventTypes): number {
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
        // Dispatch to exact-match listeners
        const callbacks = this.listeners.get(event.type);
        const invoked = new Set<EventCallback<any>>();

        if (callbacks) {
            // Create a copy of the callbacks array to avoid issues if listeners are modified during dispatch
            const callbacksCopy = [...callbacks];

            for (const callback of callbacksCopy) {
                try {
                    callback(event);
                    invoked.add(callback);
                } catch (error) {
                    console.error(`Error in event listener for '${event.type}':`, error);
                }
            }
        }

        // Also dispatch to compatibility names: convert SCREAMING_SNAKE_CASE to camelCase
        // For example: 'ENGINE:ACTIVE_SCENE_CHANGE' -> 'engine:activeSceneChange' and 'engine:activeSceneChanged'
        const parts = String(event.type).split(':');
        if (parts.length === 2) {
            const prefix = parts[0].toLowerCase();
            const name = parts[1];

            const toCamel = (s: string) => {
                return s.toLowerCase().split('_').map((part, i) => i === 0 ? part : (part.charAt(0).toUpperCase() + part.slice(1))).join('');
            };

            const camelName = toCamel(name);
            const altType = `${prefix}:${camelName}`;

            // Dispatch to prefix:camelCase (e.g. 'world:entityCreated')
            if (altType !== event.type) {
                const altCallbacks = this.listeners.get(altType as any);
                if (altCallbacks) {
                    const altCopy = [...altCallbacks];
                    for (const callback of altCopy) {
                        if (invoked.has(callback)) continue;
                        try {
                            callback(event);
                            invoked.add(callback);
                        } catch (error) {
                            console.error(`Error in event listener for '${altType}':`, error);
                        }
                    }
                }
            }

            // Also dispatch to unprefixed camelCase name (e.g. 'entityCreated' or 'keyDown')
            if (camelName !== event.type) {
                const nameOnlyCallbacks = this.listeners.get(camelName as any);
                if (nameOnlyCallbacks) {
                    const nameOnlyCopy = [...nameOnlyCallbacks];
                    for (const callback of nameOnlyCopy) {
                        if (invoked.has(callback)) continue;
                        try {
                            callback(event);
                            invoked.add(callback);
                        } catch (error) {
                            console.error(`Error in event listener for '${camelName}':`, error);
                        }
                    }
                }
            }

            // Special-case: if the name ends with '_CHANGE', also emit a past-tense 'Changed' variant for both prefixed and unprefixed forms
            if (name.endsWith('_CHANGE')) {
                const changedName = camelName + 'd';
                const changedType = `${prefix}:${changedName}`;

                if (changedType !== event.type && changedType !== altType) {
                    const changedCallbacks = this.listeners.get(changedType as any);
                    if (changedCallbacks) {
                        const changedCopy = [...changedCallbacks];
                        for (const callback of changedCopy) {
                            if (invoked.has(callback)) continue;
                            try {
                                callback(event);
                                invoked.add(callback);
                            } catch (error) {
                                console.error(`Error in event listener for '${changedType}':`, error);
                            }
                        }
                    }
                }

                if (changedName !== event.type && changedName !== camelName) {
                    const changedOnlyCallbacks = this.listeners.get(changedName as any);
                    if (changedOnlyCallbacks) {
                        const changedOnlyCopy = [...changedOnlyCallbacks];
                        for (const callback of changedOnlyCopy) {
                            if (invoked.has(callback)) continue;
                            try {
                                callback(event);
                                invoked.add(callback);
                            } catch (error) {
                                console.error(`Error in event listener for '${changedName}':`, error);
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Emit an event immediately without queuing (use with caution)
     */
    emitImmediate(type: AllEventTypes, data: any = null): void {
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

    /**
     * Destroy the event system and clean up all resources
     * This also resets the singleton instance for testing purposes
     */
    destroy(): void {
        this.listeners.clear();
        this.eventQueue = [];
        this.isProcessing = false;
        EventSystem.instance = null as any;
    }

    /**
     * Reset the singleton instance (for testing purposes)
     */
    static reset(): void {
        if (EventSystem.instance) {
            EventSystem.instance.destroy();
        }
        EventSystem.instance = null as any;
    }
}
