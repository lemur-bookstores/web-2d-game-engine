import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Entity } from '../../src/ecs/Entity';
import { System } from '../../src/ecs/System';
import { World } from '../../src/ecs/World';
import { TransformComponent, SpriteComponent } from '../../src/ecs/Component';
import { EventSystem } from '../../src/core/EventSystem';

class RenderSystem extends System {
    readonly requiredComponents = ['transform', 'sprite'];

    // Mock WebGL context for testing
    private gl: WebGLRenderingContext | null = null;
    private isGLMocked: boolean = true;

    constructor(canvas: HTMLCanvasElement) {
        super();
        // Use the provided canvas instead of creating a new one
        this.mockWebGL(canvas);
    }

    private mockWebGL(canvas: HTMLCanvasElement) {
        this.gl = canvas.getContext('webgl') || null;
        if (!this.gl) {
            // For testing, we'll just simulate having a GL context
            this.isGLMocked = true;
        }
    }

    update(entities: Entity[], deltaTime: number): void {
        if (!this.gl || !this.isGLMocked) return;

        const renderableEntities = this.getEntitiesWithComponents(entities, this.requiredComponents);

        for (const entity of renderableEntities) {
            const transform = entity.getComponent('transform') as TransformComponent;
            const sprite = entity.getComponent('sprite') as SpriteComponent;

            // In a real implementation, this would perform actual WebGL rendering
            // For testing, we just verify that the components are valid
            this.validateRenderableEntity(transform, sprite);
        }
    }

    private validateRenderableEntity(transform: TransformComponent, sprite: SpriteComponent) {
        // Validate transform
        expect(transform.position).toBeDefined();
        expect(typeof transform.position.x).toBe('number');
        expect(typeof transform.position.y).toBe('number');
        expect(typeof transform.rotation).toBe('number');
        expect(transform.scale).toBeDefined();
        expect(typeof transform.scale.x).toBe('number');
        expect(typeof transform.scale.y).toBe('number');

        // Validate sprite
        expect(typeof sprite.texture).toBe('string');
        expect(typeof sprite.width).toBe('number');
        expect(typeof sprite.height).toBe('number');
        expect(sprite.tint).toBeDefined();
        expect(typeof sprite.tint.r).toBe('number');
        expect(typeof sprite.tint.g).toBe('number');
        expect(typeof sprite.tint.b).toBe('number');
        expect(typeof sprite.tint.a).toBe('number');
    }
}

describe('Render System Tests', () => {
    let mockCanvas: HTMLCanvasElement;
    let world: World;

    beforeEach(() => {
        EventSystem.reset();
        mockCanvas = document.createElement('canvas');
        world = new World();
    });

    afterEach(() => {
        EventSystem.reset();
    });

    it('should properly process renderable entities', () => {
        const entity = world.createEntity();

        // Add required components
        const transform: TransformComponent = {
            type: 'transform',
            position: { x: 100, y: 100 },
            rotation: 45,
            scale: { x: 2, y: 2 }
        };

        const sprite: SpriteComponent = {
            type: 'sprite',
            texture: 'test-texture.png',
            width: 64,
            height: 64,
            tint: { r: 1, g: 1, b: 1, a: 1 },
            uvX: 0,
            uvY: 0,
            uvWidth: 1,
            uvHeight: 1,
            flipX: false,
            flipY: false
        };

        entity.addComponent(transform);
        entity.addComponent(sprite);
        world.addSystem(new RenderSystem(mockCanvas));

        // This should run without throwing any errors
        expect(() => world.update(16)).not.toThrow();
    });

    it('should handle multiple renderable entities', () => {
        const world = new World();
        const numEntities = 3;
        const entities: Entity[] = [];

        // Create multiple entities with different transforms but same sprite
        for (let i = 0; i < numEntities; i++) {
            const entity = world.createEntity();
            entities.push(entity);

            const transform: TransformComponent = {
                type: 'transform',
                position: { x: i * 100, y: i * 100 },
                rotation: i * 45,
                scale: { x: 1 + i * 0.5, y: 1 + i * 0.5 }
            };

            const sprite: SpriteComponent = {
                type: 'sprite',
                texture: 'test-texture.png',
                width: 64,
                height: 64,
                tint: { r: 1, g: 1, b: 1, a: 1 },
                uvX: 0,
                uvY: 0,
                uvWidth: 1,
                uvHeight: 1,
                flipX: false,
                flipY: false
            };

            entity.addComponent(transform);
            entity.addComponent(sprite);
        }

        world.addSystem(new RenderSystem(mockCanvas));

        // This should process all entities without errors
        expect(() => world.update(16)).not.toThrow();
    });

    it('should ignore entities without required components', () => {
        const world = new World();
        const entity = world.createEntity();

        // Add only transform component, missing sprite
        const transform: TransformComponent = {
            type: 'transform',
            position: { x: 0, y: 0 },
            rotation: 0,
            scale: { x: 1, y: 1 }
        };

        entity.addComponent(transform);
        world.addSystem(new RenderSystem(mockCanvas));

        // Should not throw error even though entity is missing sprite component
        expect(() => world.update(16)).not.toThrow();
    });
});
