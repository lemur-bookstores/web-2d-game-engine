import { EventSystem } from './EventSystem';

/**
 * System interface for the ECS pattern
 */
export interface System {
    update(entities: any[], deltaTime: number): void;
    initialize?(): void;
    destroy?(): void;
}

/**
 * Game loop with fixed timestep for consistent physics and variable rendering
 */
export class GameLoop {
    private lastTime = 0;
    private accumulator = 0;
    private readonly FIXED_TIMESTEP = 1 / 60; // 60 FPS for physics
    private readonly MAX_FRAMESKIP = 5;
    private running = false;
    private requestId: number | null = null;

    private systems: System[] = [];
    private entities: any[] = [];
    private eventSystem: EventSystem;

    // Performance tracking
    private frameCount = 0;
    private fpsUpdateTime = 0;
    private currentFPS = 0;
    private averageFrameTime = 0;

    constructor() {
        this.eventSystem = EventSystem.getInstance();
    }

    /**
     * get all systems in the game loop
     */
    getSystems(): System[] {
        return this.systems;
    }

    /**
     * Add a system to the game loop
     */
    addSystem(system: System): void {
        this.systems.push(system);
        if (system.initialize) {
            system.initialize();
        }
    }

    /**
     * Remove a system from the game loop
     */
    removeSystem(system: System): void {
        const index = this.systems.indexOf(system);
        if (index > -1) {
            if (system.destroy) {
                system.destroy();
            }
            this.systems.splice(index, 1);
        }
    }

    /**
     * Set the entities to be processed by systems
     */
    setEntities(entities: any[]): void {
        this.entities = entities;
    }

    /**
     * Start the game loop
     */
    start(): void {
        if (this.running) {
            console.warn('Game loop is already running');
            return;
        }

        this.running = true;
        this.lastTime = performance.now() / 1000;
        this.accumulator = 0;
        this.frameCount = 0;
        this.fpsUpdateTime = this.lastTime;

        this.eventSystem.emit('gameloop:start');
        this.loop();
    }

    /**
     * Stop the game loop
     */
    stop(): void {
        if (!this.running) {
            return;
        }

        this.running = false;
        if (this.requestId !== null) {
            cancelAnimationFrame(this.requestId);
            this.requestId = null;
        }

        this.eventSystem.emit('gameloop:stop');
    }

    /**
     * Check if the game loop is running
     */
    isRunning(): boolean {
        return this.running;
    }

    /**
     * Get the current FPS
     */
    getFPS(): number {
        return this.currentFPS;
    }

    /**
     * Get the average frame time in milliseconds
     */
    getAverageFrameTime(): number {
        return this.averageFrameTime;
    }

    /**
     * Get the fixed timestep value
     */
    getFixedTimestep(): number {
        return this.FIXED_TIMESTEP;
    }

    /**
     * Main game loop using fixed timestep
     */
    private loop(): void {
        if (!this.running) return;

        const currentTime = performance.now() / 1000;
        let deltaTime = currentTime - this.lastTime;

        // Cap deltaTime to prevent spiral of death
        deltaTime = Math.min(deltaTime, 0.25);
        this.lastTime = currentTime;

        this.accumulator += deltaTime;

        // Fixed timestep updates (physics, logic)
        let frameskip = 0;
        while (this.accumulator >= this.FIXED_TIMESTEP && frameskip < this.MAX_FRAMESKIP) {
            this.fixedUpdate(this.FIXED_TIMESTEP);
            this.accumulator -= this.FIXED_TIMESTEP;
            frameskip++;
        }

        // Variable timestep update (rendering, interpolation)
        const alpha = this.accumulator / this.FIXED_TIMESTEP;
        this.variableUpdate(deltaTime, alpha);

        // Process events
        this.eventSystem.processEvents();

        // Update performance metrics
        this.updatePerformanceMetrics(currentTime, deltaTime);

        // Schedule next frame
        this.requestId = requestAnimationFrame(() => this.loop());
    }

    /**
     * Fixed timestep update for consistent physics and game logic
     */
    private fixedUpdate(deltaTime: number): void {
        this.eventSystem.emit('gameloop:fixedUpdate', { deltaTime });

        // Update all systems with fixed timestep
        for (const system of this.systems) {
            try {
                system.update(this.entities, deltaTime);
            } catch (error) {
                console.error('Error in system update:', error);
                this.eventSystem.emit('gameloop:systemError', { system, error });
            }
        }

        this.eventSystem.emit('gameloop:fixedUpdateComplete', { deltaTime });
    }

    /**
     * Variable timestep update for rendering and interpolation
     */
    private variableUpdate(deltaTime: number, alpha: number): void {
        this.eventSystem.emit('gameloop:variableUpdate', { deltaTime, alpha });

        // This is where rendering and interpolation would happen
        // The alpha value can be used for smooth interpolation between physics states

        this.eventSystem.emit('gameloop:render', { deltaTime, alpha });
        this.eventSystem.emit('gameloop:variableUpdateComplete', { deltaTime, alpha });
    }

    /**
     * Update performance tracking metrics
     */
    private updatePerformanceMetrics(currentTime: number, deltaTime: number): void {
        this.frameCount++;
        this.averageFrameTime = deltaTime * 1000; // Convert to milliseconds

        // Update FPS every second
        if (currentTime - this.fpsUpdateTime >= 1.0) {
            this.currentFPS = this.frameCount / (currentTime - this.fpsUpdateTime);
            this.frameCount = 0;
            this.fpsUpdateTime = currentTime;

            this.eventSystem.emit('gameloop:fpsUpdate', {
                fps: this.currentFPS,
                averageFrameTime: this.averageFrameTime
            });
        }
    }

    /**
     * Pause the game loop (keeps it running but skips updates)
     */
    pause(): void {
        if (this.running) {
            this.eventSystem.emit('gameloop:pause');
        }
    }

    /**
     * Resume the game loop from pause
     */
    resume(): void {
        if (this.running) {
            this.lastTime = performance.now() / 1000;
            this.accumulator = 0;
            this.eventSystem.emit('gameloop:resume');
        }
    }

    /**
     * Step the game loop one fixed timestep (useful for debugging)
     */
    step(): void {
        if (!this.running) {
            this.fixedUpdate(this.FIXED_TIMESTEP);
            this.eventSystem.processEvents();
            this.eventSystem.emit('gameloop:step');
        }
    }

    /**
     * Destroy the game loop and clean up resources
     */
    destroy(): void {
        this.stop();

        // Destroy all systems
        for (const system of this.systems) {
            if (system.destroy) {
                system.destroy();
            }
        }

        this.systems = [];
        this.entities = [];

        this.eventSystem.emit('gameloop:destroy');
    }
}
