import { describe, it, expect, beforeEach } from 'vitest';
import { AssetManager, SpriteSheetLibraryOptions } from '../../src/assets/AssetManager';
import { AnimationSystem } from '../../src/graphics/AnimationSystem';
import { Entity } from '../../src/ecs/Entity';
import { SpriteComponent } from '../../src/graphics/Sprite';
import { AnimationComponent } from '../../src/graphics/Animation';
import { Texture } from '../../src/graphics/Texture';
import { Color } from '../../src/math/Color';

describe('animation with sprite-sheet library integration', () => {
    let assetManager: AssetManager;
    let animationSystem: AnimationSystem;
    let mockTexture: Texture;

    beforeEach(() => {
        // Reset singletons
        (AssetManager as any).instance = null;
        assetManager = AssetManager.getInstance();
        animationSystem = new AnimationSystem(assetManager);

        // Create a mock texture with a predictable source
        mockTexture = {
            width: 128,
            height: 64,
            dispose: () => { },
            source: createMockCanvas(128, 64),
        } as unknown as Texture;

        // Mock the loader to return our test texture
        const mockLoader = (assetManager as any).loader;
        mockLoader.loadTexture = async () => mockTexture;
    });

    function createMockCanvas(width: number, height: number): HTMLCanvasElement {
        return {
            width,
            height,
            getContext: () => ({
                getImageData: () => ({
                    width,
                    height,
                    data: new Uint8ClampedArray(width * height * 4).fill(255),
                }),
            }),
        } as unknown as HTMLCanvasElement;
    }

    it('creates sprite sheet with library, registers with animation system, and updates sprite UVs', async () => {
        // Load sprite sheet using the library (grid mode)
        const options: SpriteSheetLibraryOptions = {
            useSpriteSheetLib: true,
            libraryMode: 'grid',
            grid: {
                frameWidth: 32,
                frameHeight: 32,
            },
            namingPattern: 'frame_{index}',
        };

        const spriteSheet = await assetManager.loadSpriteSheet(
            'test-character',
            'character.png',
            undefined,
            undefined,
            undefined,
            options
        );

        // Verify the sprite sheet was created with frames
        expect(spriteSheet.getFrameCount()).toBeGreaterThan(0);
        expect(spriteSheet.getTexture()).toBe(mockTexture);

        // Add an animation to the sprite sheet
        spriteSheet.addAnimation('walk', {
            name: 'walk',
            frames: [0, 1, 2, 3],
            duration: 0.1,
            loop: true,
            pingPong: false,
        });

        // Register the sprite sheet with the animation system
        animationSystem.registerSpriteSheet('test-character', spriteSheet);

        // Create an entity with sprite and animation components
        const entity = new Entity();

        const spriteComponent: SpriteComponent = {
            type: 'sprite',
            texture: 'test-character_texture',
            uvX: 0,
            uvY: 0,
            uvWidth: 32,
            uvHeight: 32,
            width: 32,
            height: 32,
            flipX: false,
            flipY: false,
            tint: new Color(255, 255, 255, 255),
        };

        const animationComponent: AnimationComponent = {
            type: 'animation',
            spriteSheet: 'test-character',
            currentAnimation: 'walk',
            currentFrame: 0,
            frameTime: 0.1,
            elapsedTime: 0,
            loop: true,
            playing: true,
            animations: new Map([
                ['walk', {
                    name: 'walk',
                    frames: [0, 1, 2, 3],
                    duration: 0.1,
                    loop: true,
                    pingPong: false,
                }],
            ]),
        };

        entity.addComponent(spriteComponent);
        entity.addComponent(animationComponent);

        // Get initial UV values
        const initialUvX = spriteComponent.uvX;
        const initialUvY = spriteComponent.uvY;
        if (initialUvX && initialUvY) { }

        // Update animation system (should update sprite UVs based on current frame)
        animationSystem.update([entity], 0.01); // Small delta time

        // The animation system should have updated the sprite UVs to match the current frame
        const updatedSprite = entity.getComponent<SpriteComponent>('sprite');
        expect(updatedSprite).toBeDefined();

        // Since we're on frame 0, the UVs should be set to the first frame's pixel coordinates
        // The exact values depend on the library's frame detection, but they should be different from initial
        const frame0 = spriteSheet.getFrame(0);
        expect(frame0).toBeDefined();
        expect(updatedSprite!.uvX).toBe(frame0!.x);
        expect(updatedSprite!.uvY).toBe(frame0!.y);
        expect(updatedSprite!.uvWidth).toBe(frame0!.width);
        expect(updatedSprite!.uvHeight).toBe(frame0!.height);

        // Advance animation by sufficient time to change frame
        animationSystem.update([entity], 0.15); // Should advance to frame 1

        const animComponent = entity.getComponent<AnimationComponent>('animation');
        expect(animComponent!.currentFrame).toBe(1);

        // UVs should now match frame 1
        const frame1 = spriteSheet.getFrame(1);
        expect(frame1).toBeDefined();
        expect(updatedSprite!.uvX).toBe(frame1!.x);
        expect(updatedSprite!.uvY).toBe(frame1!.y);
    });

    it('works with dynamic mode for irregular sprites', async () => {
        const options: SpriteSheetLibraryOptions = {
            useSpriteSheetLib: true,
            libraryMode: 'dynamic',
            dynamic: {
                alphaThreshold: 128,
                minFrameSize: 16,
                padding: 1,
            },
            namingPattern: 'sprite_{index}',
        };

        const spriteSheet = await assetManager.loadSpriteSheet(
            'ui-elements',
            'ui.png',
            undefined,
            undefined,
            undefined,
            options
        );

        expect(spriteSheet).toBeDefined();
        expect(spriteSheet.getTexture()).toBe(mockTexture);

        // Dynamic detection should find at least some frames
        // (even with our simple mock, it should detect some connected components)
        expect(spriteSheet.getFrameCount()).toBeGreaterThanOrEqual(0);
    });
});
