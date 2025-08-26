import { describe, it, expect } from 'vitest';
import { convertNormalizedToPixelFrames, createImageDataFromCanvas } from '../../src/libs/sprite-sheet/engine-adapter';
import { SpriteFrame } from '../../src/libs/sprite-sheet';
import { SpriteSheet } from '../../src/graphics/SpriteSheet';
import { Texture } from '../../src/graphics/Texture';

describe('sprite-sheet engine adapter', () => {
    it('convertNormalizedToPixelFrames converts UV coordinates to pixels correctly', () => {
        const mockTexture = { width: 100, height: 50 };

        const spriteFrames: SpriteFrame[] = [
            { name: 'frame_0', uvX: 0, uvY: 0, uvWidth: 0.5, uvHeight: 0.4 },
            { name: 'frame_1', uvX: 0.5, uvY: 0.4, uvWidth: 0.5, uvHeight: 0.6 },
        ];

        const pixelFrames = convertNormalizedToPixelFrames(mockTexture, spriteFrames);

        expect(pixelFrames).toHaveLength(2);

        // First frame: uvX=0, uvY=0, uvWidth=0.5, uvHeight=0.4
        // Expected: x=0, y=0, width=50, height=20
        expect(pixelFrames[0]).toEqual({ x: 0, y: 0, width: 50, height: 20 });

        // Second frame: uvX=0.5, uvY=0.4, uvWidth=0.5, uvHeight=0.6
        // Expected: x=50, y=20, width=50, height=30
        expect(pixelFrames[1]).toEqual({ x: 50, y: 20, width: 50, height: 30 });
    });

    it('convertNormalizedToPixelFrames clamps to texture boundaries', () => {
        const mockTexture = { width: 10, height: 10 };

        const spriteFrames: SpriteFrame[] = [
            // This frame would exceed texture bounds without clamping
            { name: 'oversized', uvX: 0.8, uvY: 0.8, uvWidth: 0.5, uvHeight: 0.5 },
        ];

        const pixelFrames = convertNormalizedToPixelFrames(mockTexture, spriteFrames);

        expect(pixelFrames).toHaveLength(1);

        // x=8, y=8, but width/height should be clamped to not exceed texture
        expect(pixelFrames[0].x).toBe(8);
        expect(pixelFrames[0].y).toBe(8);
        expect(pixelFrames[0].width).toBeLessThanOrEqual(2); // 10 - 8 = 2
        expect(pixelFrames[0].height).toBeLessThanOrEqual(2);
        expect(pixelFrames[0].width).toBeGreaterThanOrEqual(1); // Minimum 1x1
        expect(pixelFrames[0].height).toBeGreaterThanOrEqual(1);
    });

    it('SpriteSheet.fromFrames creates a sprite sheet with custom frames', () => {
        // Mock Texture (we'll create a minimal one for testing)
        const mockTexture = {
            width: 64,
            height: 32,
            dispose: () => { },
        } as unknown as Texture;

        const frames = [
            { x: 0, y: 0, width: 32, height: 32 },
            { x: 32, y: 0, width: 32, height: 32 },
        ];

        const spriteSheet = SpriteSheet.fromFrames(mockTexture, frames);

        expect(spriteSheet.getFrameCount()).toBe(2);
        expect(spriteSheet.getFrame(0)).toEqual({ x: 0, y: 0, width: 32, height: 32 });
        expect(spriteSheet.getFrame(1)).toEqual({ x: 32, y: 0, width: 32, height: 32 });
        expect(spriteSheet.getTexture()).toBe(mockTexture);
    });

    it('SpriteSheet.fromFrames preserves ability to add animations', () => {
        const mockTexture = {
            width: 64,
            height: 32,
            dispose: () => { },
        } as unknown as Texture;

        const frames = [
            { x: 0, y: 0, width: 16, height: 16 },
            { x: 16, y: 0, width: 16, height: 16 },
            { x: 32, y: 0, width: 16, height: 16 },
        ];

        const spriteSheet = SpriteSheet.fromFrames(mockTexture, frames);

        // Add an animation using frame indices
        spriteSheet.addAnimation('walk', {
            name: 'walk',
            frames: [0, 1, 2],
            duration: 0.1,
            loop: true,
            pingPong: false,
        });

        const walkAnimation = spriteSheet.getAnimation('walk');
        expect(walkAnimation).toBeDefined();
        expect(walkAnimation!.frames).toEqual([0, 1, 2]);
        expect(walkAnimation!.loop).toBe(true);
    });
});
