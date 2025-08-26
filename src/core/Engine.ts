import { GameLoop, System } from './GameLoop';
import { EventSystem } from './EventSystem';
import { Scene, CollisionLayer } from './Scene';
import { EngineConfig } from '../types';
import { RenderSystem } from '../graphics/RenderSystem';
import { Canvas2DRenderer } from '../graphics/Canvas2DRenderer';
import { WebGLRenderer } from '../graphics/WebGLRenderer';
import { DiagnosticRenderer } from '../graphics/DiagnosticRenderer';
import { ENGINE_EVENTS, GAMELOOP_EVENTS } from '@/types/event-const';

/**
 * Main engine class that coordinates all game systems
 */
export class Engine {
    private canvas!: HTMLCanvasElement;
    private gameLoop: GameLoop;
    private eventSystem: EventSystem;
    private scenes = new Map<string, Scene>();
    private activeScene: Scene | null = null;
    private initialized = false;
    private config: EngineConfig;
    private debugMode: boolean;
    private renderSystem: RenderSystem | null = null;

    // Default collision layers (fallback when Scene doesn't define custom layers)
    public readonly defaultLayers: CollisionLayer[] = [
        { name: 'default', bit: 0x0001, mask: 0xFFFF },
        { name: 'player', bit: 0x0002, mask: 0xFFFF },
        { name: 'enemy', bit: 0x0004, mask: 0xFFFF },
        { name: 'ground', bit: 0x0008, mask: 0xFFFF },
        { name: 'pickup', bit: 0x0010, mask: 0xFFFF },
        { name: 'ui', bit: 0x0020, mask: 0xFFFF }
    ];

    // Engine stats
    private startTime: number = 0;
    private totalFrames: number = 0;

    constructor(config: EngineConfig) {
        this.config = { ...config };
        this.debugMode = config.debug ?? false;
        this.eventSystem = EventSystem.getInstance();
        this.gameLoop = new GameLoop();

        this.setupCanvas();
        this.setupEventListeners();

        if (this.debugMode) {
            this.debugLog('GameEngine 2D created in debug mode');
        }
    }

    /**
     * Initialize the engine
     */
    async initialize(): Promise<void> {
        if (this.initialized) {
            console.warn('Engine is already initialized');
            return;
        }

        try {
            this.eventSystem.emit(ENGINE_EVENTS.INITIALIZING);

            // Resize canvas to match config
            this.resizeCanvas(this.config.width, this.config.height);

            // Detect WebGL support and fallback if necessary
            await this.initializeRenderer();

            // Setup game loop to use current scene entities
            this.setupGameLoopEntityProvider();

            this.initialized = true;
            this.eventSystem.emit(ENGINE_EVENTS.INITIALIZED);

            this.debugLog('GameEngine 2D initialized successfully');
        } catch (error) {
            this.eventSystem.emit(ENGINE_EVENTS.INITIALIZATION_ERROR, { error });
            throw error;
        }
    }

    /**
     * Start the engine
     */
    start(): void {
        if (!this.initialized) {
            throw new Error('Engine must be initialized before starting');
        }

        this.startTime = performance.now();
        this.totalFrames = 0;

        this.gameLoop.start();
        this.eventSystem.emit(ENGINE_EVENTS.STARTED);

        this.debugLog('GameEngine 2D started');
    }

    /**
     * Stop the engine
     */
    stop(): void {
        this.gameLoop.stop();
        this.eventSystem.emit(ENGINE_EVENTS.STOPPED);

        this.debugLog('GameEngine 2D stopped');
    }

    /**
     * Pause the engine
     */
    pause(): void {
        this.gameLoop.pause();
        this.eventSystem.emit(ENGINE_EVENTS.PAUSED);
        this.debugLog('GameEngine 2D paused');
    }

    /**
     * Resume the engine
     */
    resume(): void {
        this.gameLoop.resume();
        this.eventSystem.emit(ENGINE_EVENTS.RESUMED);
        this.debugLog('GameEngine 2D resumed');
    }

    /**
     * Add a system to the engine
     */
    addSystem(system: System): void {
        this.gameLoop.addSystem(system);
        this.eventSystem.emit(ENGINE_EVENTS.SYSTEM_ADDED, { system });
        this.debugLog('System added:', system.constructor.name);
    }

    /**
     * Remove a system from the engine
     */
    removeSystem(system: System): void {
        this.gameLoop.removeSystem(system);
        this.eventSystem.emit(ENGINE_EVENTS.SYSTEM_REMOVED, { system });
        this.debugLog('System removed:', system.constructor.name);
    }

    /**
     * Add a scene to the engine
     */
    addScene(scene: Scene): void {
        if (this.scenes.has(scene.name)) {
            throw new Error(`Scene with name '${scene.name}' already exists`);
        }

        this.scenes.set(scene.name, scene);
        scene.initialize();

        this.eventSystem.emit(ENGINE_EVENTS.SCENE_ADDED, { scene });
        this.debugLog('Scene added:', scene.name);
    }

    /**
     * Remove a scene from the engine
     */
    removeScene(sceneName: string): boolean {
        const scene = this.scenes.get(sceneName);
        if (!scene) {
            return false;
        }

        // If this is the active scene, deactivate it
        if (this.activeScene === scene) {
            this.setActiveScene(null);
        }

        scene.destroy();
        this.scenes.delete(sceneName);

        this.eventSystem.emit(ENGINE_EVENTS.SCENE_REMOVED, { scene, sceneName });
        this.debugLog('Scene removed:', sceneName);
        return true;
    }

    /**
     * Get a scene by name
     */
    getScene(sceneName: string): Scene | undefined {
        return this.scenes.get(sceneName);
    }

    /**
     * Set the active scene
     */
    setActiveScene(sceneNameOrScene: string | Scene | null): void {
        let scene: Scene | null = null;

        if (typeof sceneNameOrScene === 'string') {
            scene = this.scenes.get(sceneNameOrScene) || null;
            if (!scene) {
                throw new Error(`Scene '${sceneNameOrScene}' not found`);
            }
        } else {
            scene = sceneNameOrScene;
        }

        // Store previous scene before changing
        const previousScene = this.activeScene;

        // Deactivate current scene
        if (this.activeScene) {
            this.activeScene.onExit();
        }

        // Activate new scene
        this.activeScene = scene;
        if (this.activeScene) {
            this.activeScene.onEnter();
        }

        this.eventSystem.emit(ENGINE_EVENTS.ACTIVE_SCENE_CHANGE, {
            previousScene: previousScene,
            newScene: this.activeScene
        });

        this.debugLog('Active scene changed from',
            previousScene?.name || 'none',
            'to',
            this.activeScene?.name || 'none');
    }

    /**
     * Get the active scene
     */
    getActiveScene(): Scene | null {
        return this.activeScene;
    }

    /**
     * Get all scenes
     */
    getScenes(): Scene[] {
        return Array.from(this.scenes.values());
    }

    /**
     * Get the canvas element
     */
    getCanvas(): HTMLCanvasElement {
        return this.canvas;
    }

    /**
     * Get the engine configuration
     */
    getConfig(): EngineConfig {
        return { ...this.config };
    }

    /**
     * Get the engine configuration
     */
    getWidth(): number {
        return this.config.width;
    }

    /**
     * Get the engine configuration
     */
    getHeight(): number {
        return this.config.height;
    }

    /**
     * Get the event system
     */
    getEventSystem(): EventSystem {
        return this.eventSystem;
    }

    /**
     * Get the game loop
     */
    getGameLoop(): GameLoop {
        return this.gameLoop;
    }

    /**
     * Check if the engine is initialized
     */
    isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Check if the engine is running
     */
    isRunning(): boolean {
        return this.gameLoop.isRunning();
    }

    /**
     * Get engine performance stats
     */
    getStats(): {
        fps: number;
        averageFrameTime: number;
        uptime: number;
        totalFrames: number;
    } {
        const uptime = this.startTime > 0 ? (performance.now() - this.startTime) / 1000 : 0;

        return {
            fps: this.gameLoop.getFPS(),
            averageFrameTime: this.gameLoop.getAverageFrameTime(),
            uptime,
            totalFrames: this.totalFrames
        };
    }

    /**
     * Resize the canvas
     */
    resizeCanvas(width: number, height: number): void {
        this.canvas.width = width;
        this.canvas.height = height;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;

        this.config.width = width;
        this.config.height = height;

        this.eventSystem.emit(ENGINE_EVENTS.CANVAS_RESIZED, { width, height });
        this.debugLog('Canvas resized to', `${width}x${height}`);
    }

    /**
     * Destroy the engine and clean up resources
     */
    destroy(): void {
        this.stop();

        // Destroy all scenes
        for (const scene of this.scenes.values()) {
            scene.destroy();
        }
        this.scenes.clear();
        this.activeScene = null;

        // Destroy game loop
        this.gameLoop.destroy();

        this.initialized = false;
        this.eventSystem.emit(ENGINE_EVENTS.DESTROYED);

        this.debugLog('GameEngine 2D destroyed');
    }

    /**
     * Initialize the renderer with WebGL fallback to Canvas2D
     */
    private async initializeRenderer(): Promise<void> {
        try {
            this.debugLog('Initializing renderer...');

            // Try WebGL first if requested
            if (this.config.renderer === 'webgl') {
                this.debugLog('Attempting WebGL initialization...');

                if (this.isWebGLSupported()) {
                    const webglRenderer = new WebGLRenderer();
                    try {
                        webglRenderer.initialize(this.canvas);
                        this.renderSystem = new RenderSystem(webglRenderer);
                        this.addSystem(this.renderSystem);
                        this.debugLog('WebGL renderer initialized successfully');

                        // Add diagnostic overlay if in debug mode
                        if (this.debugMode) {
                            this.addDiagnosticOverlay();
                        }
                        return;
                    } catch (webglError) {
                        this.debugLog('WebGL initialization failed:', webglError);
                        console.warn('WebGL initialization failed, falling back to Canvas2D:', webglError);
                    }
                } else {
                    this.debugLog('WebGL not supported, falling back to Canvas2D');
                    console.warn('WebGL not supported, falling back to Canvas2D');
                }
            }

            // Fallback to Canvas2D
            this.debugLog('Initializing Canvas2D renderer...');
            const canvas2dRenderer = new Canvas2DRenderer();
            canvas2dRenderer.initialize(this.canvas);
            this.renderSystem = new RenderSystem(canvas2dRenderer);
            this.addSystem(this.renderSystem);
            this.debugLog('Canvas2D renderer initialized successfully');

            // Add diagnostic overlay if in debug mode
            if (this.debugMode) {
                this.addDiagnosticOverlay();
            }

        } catch (error) {
            this.debugLog('Renderer initialization failed:', error);
            throw new Error(`Failed to initialize renderer: ${error}`);
        }
    }

    /**
     * Add diagnostic overlay for debugging
     */
    private addDiagnosticOverlay(): void {
        try {
            this.debugLog('Adding diagnostic overlay...');
            const diagnosticRenderer = new DiagnosticRenderer();
            diagnosticRenderer.initialize(this.canvas);

            // Add diagnostic system BEFORE main render system so it renders underneath
            const diagnosticRenderSystem = new RenderSystem(diagnosticRenderer);
            // Insert at the beginning of systems array instead of at the end
            this.gameLoop.getSystems().unshift(diagnosticRenderSystem);

            this.debugLog('Diagnostic overlay added successfully');
        } catch (error) {
            this.debugLog('Failed to add diagnostic overlay:', error);
            console.warn('Failed to add diagnostic overlay:', error);
        }
    }    /**
     * Check if WebGL is supported by the browser
     */
    private isWebGLSupported(): boolean {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            return !!gl;
        } catch (e) {
            return false;
        }
    }

    /**
     * Setup the canvas element
     */
    private setupCanvas(): void {
        if (typeof this.config.canvas === 'string') {
            const element = document.querySelector(this.config.canvas) as HTMLCanvasElement;
            if (!element) {
                throw new Error(`Canvas element not found: ${this.config.canvas}`);
            }
            this.canvas = element;
        } else {
            this.canvas = this.config.canvas;
        }

        if (!(this.canvas instanceof HTMLCanvasElement)) {
            throw new Error('Invalid canvas element provided');
        }
    }

    /**
     * Setup engine event listeners
     */
    private setupEventListeners(): void {
        // Listen to game loop events to update frame counter
        this.eventSystem.on(GAMELOOP_EVENTS.FIXED_UPDATE, () => {
            this.totalFrames++;
        });

        // Handle window resize if canvas should be responsive
        window.addEventListener('resize', () => {
            this.eventSystem.emit(ENGINE_EVENTS.WINDOW_RESIZED, {
                width: window.innerWidth,
                height: window.innerHeight
            });
        });

        // Handle visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.eventSystem.emit(ENGINE_EVENTS.WINDOW_HIDDEN);
            } else {
                this.eventSystem.emit(ENGINE_EVENTS.WINDOW_VISIBLE);
            }
        });
    }

    /**
     * Setup the game loop to provide entities from the active scene
     */
    private setupGameLoopEntityProvider(): void {
        // Update the game loop with active scene entities each frame
        this.eventSystem.on(GAMELOOP_EVENTS.FIXED_UPDATE, () => {
            if (this.activeScene) {
                const entities = this.activeScene.getActiveEntities();
                this.gameLoop.setEntities(entities);
            }
        });
    }

    /**
     * Log debug messages if debug mode is enabled
     */
    private debugLog(message: string, ...args: any[]): void {
        if (this.debugMode) {
            console.log(`[GameEngine Debug] ${message}`, ...args);
        }
    }

    /**
     * Check if debug mode is enabled
     */
    isDebugMode(): boolean {
        return this.debugMode;
    }

    /**
     * Enable or disable debug mode
     */
    setDebugMode(enabled: boolean): void {
        this.debugMode = enabled;
        this.debugLog(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Get layer mask from layer names (uses active scene layers or engine defaults)
     */
    getLayerMask(layerNames: string[]): number {
        if (this.activeScene) {
            return this.activeScene.getLayerMask(layerNames);
        }

        // Fallback to engine default layers
        let mask = 0;
        for (const name of layerNames) {
            const layer = this.defaultLayers.find(l => l.name === name);
            if (layer) {
                mask |= layer.bit;
            }
        }
        return mask;
    }
}
