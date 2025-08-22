import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameEngine } from '../../src/index';
import { EventSystem } from '../../src/core/EventSystem';
import { Scene } from '../../src/core/Scene';
import { System } from '../../src/core/GameLoop';

describe('Game Engine Tests', () => {
    let engine: GameEngine;
    let mockCanvas: HTMLCanvasElement;

    beforeEach(() => {
        // Mock canvas and context
        mockCanvas = document.createElement('canvas');
        const mockContext = mockCanvas.getContext('2d');
        vi.spyOn(mockCanvas, 'getContext').mockReturnValue(mockContext);

        // Create engine instance
        engine = new GameEngine({
            canvas: mockCanvas,
            width: 800,
            height: 600,
            renderer: 'webgl'
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
        engine.stop();
    });

    describe('Initialization', () => {
        it('should initialize successfully', async () => {
            expect(engine).toBeDefined();
            await engine.initialize();
            expect(mockCanvas.width).toBe(800);
            expect(mockCanvas.height).toBe(600);
        });

        it('should setup event system on initialization', async () => {
            const eventSystem = EventSystem.getInstance();
            let initReceived = false;

            eventSystem.on('engine:initialized', () => {
                initReceived = true;
            });

            await engine.initialize();
            expect(initReceived).toBe(true);
        });
    });

    describe('Scene Management', () => {
        it('should add and get scenes', async () => {
            await engine.initialize();

            const scene = new Scene('level1');
            engine.addScene(scene);

            const retrievedScene = engine.getScene('level1');
            expect(retrievedScene).toBe(scene);
        });

        it('should handle scene transitions properly', async () => {
            await engine.initialize();

            const scene1 = new Scene('scene1');
            const scene2 = new Scene('scene2');

            engine.addScene(scene1);
            engine.addScene(scene2);

            let sceneChangedData: any = null;
            const eventSystem = EventSystem.getInstance();
            eventSystem.on('engine:activeSceneChanged', (data) => {
                sceneChangedData = data;
            });

            engine.setActiveScene('scene2');

            expect(sceneChangedData).toBeDefined();
            expect(sceneChangedData.newScene).toBe(scene2);
        });

        it('should throw error for nonexistent scenes', async () => {
            await engine.initialize();

            expect(() => {
                engine.setActiveScene('nonexistent-scene');
            }).toThrow();
        });
    });

    describe('Game Loop', () => {
        it('should start and stop the game loop', async () => {
            await engine.initialize();

            let started = false;
            let stopped = false;
            const eventSystem = EventSystem.getInstance();

            eventSystem.on('engine:started', () => started = true);
            eventSystem.on('engine:stopped', () => stopped = true);

            engine.start();
            expect(started).toBe(true);

            engine.stop();
            expect(stopped).toBe(true);
        });

        it('should execute systems', async () => {
            await engine.initialize();

            let updateCount = 0;
            const testSystem: System = {
                update: (entities: any[], deltaTime: number) => {
                    updateCount++;
                }
            };

            engine.addSystem(testSystem);
            engine.start();

            // Wait for a few frames
            await new Promise(resolve => setTimeout(resolve, 100));

            engine.stop();
            expect(updateCount).toBeGreaterThan(0);
        });
    });

    describe('Error Handling', () => {
        it('should handle initialization errors gracefully', async () => {
            const invalidEngine = new GameEngine({
                canvas: null as any,
                width: 800,
                height: 600,
                renderer: 'webgl'
            });

            let errorReceived = false;
            const eventSystem = EventSystem.getInstance();
            eventSystem.on('engine:initializationError', () => {
                errorReceived = true;
            });

            try {
                await invalidEngine.initialize();
            } catch (error) {
                // Initialization should throw
            }

            expect(errorReceived).toBe(true);
        });

        it('should handle system errors without crashing', async () => {
            await engine.initialize();

            const errorSystem: System = {
                update: () => {
                    throw new Error('Test error');
                }
            };

            engine.addSystem(errorSystem);
            engine.start();

            // Wait for a few frames
            await new Promise(resolve => setTimeout(resolve, 100));

            // Engine should continue running
            const eventSystem = EventSystem.getInstance();
            let updateReceived = false;
            eventSystem.on('gameloop:fixedUpdate', () => {
                updateReceived = true;
            });

            await new Promise(resolve => setTimeout(resolve, 50));
            expect(updateReceived).toBe(true);

            engine.stop();
        });
    });
});
