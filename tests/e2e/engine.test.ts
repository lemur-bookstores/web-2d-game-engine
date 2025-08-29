import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameEngine } from '../../src/index';
import { EventSystem } from '../../src/core/EventSystem';
import { Scene } from '../../src/core/Scene';
import { System } from '../../src/core/GameLoop';
import { ENGINE_EVENTS, GAMELOOP_EVENTS } from '@/types/event-const';

describe('Game Engine Tests', () => {
    let engine: GameEngine;
    let mockCanvas: HTMLCanvasElement;

    beforeEach(() => {
        // Mock canvas and context
        mockCanvas = document.createElement('canvas');
        const mockContext = mockCanvas.getContext('2d');
        vi.spyOn(mockCanvas, 'getContext').mockReturnValue(mockContext);

        // Reset EventSystem singleton
        EventSystem.reset();

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
        if (engine) {
            engine.stop();
        }
        EventSystem.reset();
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

            eventSystem.on(ENGINE_EVENTS.INITIALIZED, () => {
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
            eventSystem.on(ENGINE_EVENTS.ACTIVE_SCENE_CHANGE, (data) => {
                sceneChangedData = data;
            });

            engine.setActiveScene('scene2');

            // Wait for event to be processed
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(sceneChangedData).toBeDefined();
            expect(sceneChangedData.data.newScene).toBe(scene2);
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

            eventSystem.on(ENGINE_EVENTS.STARTED, () => started = true);
            eventSystem.on(ENGINE_EVENTS.STOPPED, () => stopped = true);

            engine.start();
            expect(started).toBe(true);

            engine.stop();
            expect(stopped).toBe(true);
        });

        it('should execute systems', async () => {
            await engine.initialize();

            let updateCount = 0;
            const testSystem: System = {
                update: (_entities: any[], _deltaTime: number) => {
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
            // let errorReceived = false;
            // const eventSystem = EventSystem.getInstance();
            // eventSystem.on(ENGINE_EVENTS.INITIALIZATION_ERROR, () => {
            //     errorReceived = true;
            // });

            // Test should throw on constructor, not on initialize
            expect(() => {
                new GameEngine({
                    canvas: null as any,
                    width: 800,
                    height: 600,
                    renderer: 'webgl'
                });
            }).toThrow('Invalid canvas element provided');
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
            eventSystem.on(GAMELOOP_EVENTS.FIXED_UPDATE, () => {
                updateReceived = true;
            });

            await new Promise(resolve => setTimeout(resolve, 50));
            expect(updateReceived).toBe(true);

            engine.stop();
        });
    });
});
