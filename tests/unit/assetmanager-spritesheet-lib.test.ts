import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssetManager, SpriteSheetLibraryOptions } from '../../src/assets/AssetManager';
import { Texture } from '../../src/graphics/Texture';

describe('AssetManager sprite-sheet library integration', () => {
    let assetManager: AssetManager;
    let mockTexture: Texture;

    beforeEach(() => {
        // Reset the singleton
        (AssetManager as any).instance = null;

        // Mock AssetLoader before creating AssetManager
        vi.doMock('../../src/assets/AssetLoader', () => ({
            AssetLoader: {
                getInstance: vi.fn().mockReturnValue({
                    loadTexture: vi.fn(),
                    loadJSON: vi.fn(),
                }),
            },
        }));

        assetManager = AssetManager.getInstance();

        // Create a mock texture
        mockTexture = {
            width: 64,
            height: 32,
            dispose: vi.fn(),
            // Add a mock source for ImageData creation
            source: createMockCanvas(64, 32),
        } as unknown as Texture;

        // Mock the loader methods
        const mockLoader = (assetManager as any).loader;
        mockLoader.loadTexture = vi.fn().mockResolvedValue(mockTexture);
        mockLoader.loadJSON = vi.fn();
    });

    function createMockCanvas(width: number, height: number): HTMLCanvasElement {
        // Create a mock canvas for testing
        const canvas = {
            width,
            height,
            getContext: vi.fn().mockReturnValue({
                getImageData: vi.fn().mockReturnValue({
                    width,
                    height,
                    data: new Uint8ClampedArray(width * height * 4).fill(255),
                }),
            }),
        };
        return canvas as unknown as HTMLCanvasElement;
    }

    it('loads sprite sheet using grid library mode', async () => {
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
            'test-sprite',
            'test.png',
            undefined,
            undefined,
            undefined,
            options
        );

        expect(spriteSheet).toBeDefined();
        expect(spriteSheet.getFrameCount()).toBeGreaterThan(0);
        expect(spriteSheet.getTexture()).toBe(mockTexture);
    });

    it('loads sprite sheet using dynamic library mode', async () => {
        const options: SpriteSheetLibraryOptions = {
            useSpriteSheetLib: true,
            libraryMode: 'dynamic',
            dynamic: {
                alphaThreshold: 128,
                minFrameSize: 16,
                padding: 2,
            },
            namingPattern: 'sprite_{index}',
        };

        const spriteSheet = await assetManager.loadSpriteSheet(
            'test-sprite-dynamic',
            'test.png',
            undefined,
            undefined,
            undefined,
            options
        );

        expect(spriteSheet).toBeDefined();
        expect(spriteSheet.getTexture()).toBe(mockTexture);
    });

    it('falls back to traditional method when useSpriteSheetLib is false', async () => {
        const spriteSheet = await assetManager.loadSpriteSheet(
            'traditional-sprite',
            'test.png',
            undefined,
            32,
            32
        );

        expect(spriteSheet).toBeDefined();
        expect(spriteSheet.getFrameCount()).toBeGreaterThan(0);
        expect(spriteSheet.getTexture()).toBe(mockTexture);
    });

    it('throws error when grid mode is selected but frame dimensions are missing', async () => {
        const options: SpriteSheetLibraryOptions = {
            useSpriteSheetLib: true,
            libraryMode: 'grid',
            grid: {
                frameWidth: 0,
                frameHeight: 0
            }
            // Missing grid.frameWidth and frameHeight
        };

        await expect(
            assetManager.loadSpriteSheet(
                'invalid-sprite',
                'test.png',
                undefined,
                undefined,
                undefined,
                options
            )
        ).rejects.toThrow('Grid mode requires frameWidth and frameHeight');
    });

    it('prefers atlas over library when both are provided', async () => {
        const mockAtlasData = {
            frames: [
                { frame: { x: 0, y: 0, w: 32, h: 32 } },
                { frame: { x: 32, y: 0, w: 32, h: 32 } },
            ],
        };

        const mockLoader = (assetManager as any).loader;
        mockLoader.loadJSON = vi.fn().mockResolvedValue(mockAtlasData);

        const options: SpriteSheetLibraryOptions = {
            useSpriteSheetLib: true,
            libraryMode: 'grid',
            grid: { frameWidth: 16, frameHeight: 16 },
        };

        const spriteSheet = await assetManager.loadSpriteSheet(
            'atlas-sprite',
            'test.png',
            'test.json', // Atlas path provided
            undefined,
            undefined,
            options
        );

        expect(spriteSheet).toBeDefined();
        expect(spriteSheet.getFrameCount()).toBe(2); // From atlas, not library
    });
});
