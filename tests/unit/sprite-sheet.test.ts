import { describe, it, expect } from 'vitest';

import {
    GridFrameDetectionAdapter,
    DynamicFrameDetectionAdapter,
    UVCoordinateCalculatorService,
    SpriteSheetLibrary,
    Rectangle,
    ImageSize,
    GridDetectionConfig,
    DynamicDetectionConfig,
    SpriteFrame
} from '../../src/libs/sprite-sheet';

describe('sprite-sheet library - unit', () => {
    it('UVCoordinateCalculatorService normalizes rectangles to UVs', () => {
        const svc = new UVCoordinateCalculatorService();
        const rect = new Rectangle(10, 5, 30, 20);
        const imageSize = new ImageSize(100, 50);

        const uvs = svc.calculateUVCoordinates([rect], imageSize);
        expect(uvs).toHaveLength(1);
        const uv = uvs[0];
        expect(uv.x).toBeCloseTo(0.1);
        expect(uv.y).toBeCloseTo(0.1);
        expect(uv.width).toBeCloseTo(0.3);
        expect(uv.height).toBeCloseTo(0.4);
    });

    it('GridFrameDetectionAdapter produces grid rectangles for a simple image', () => {
        const width = 4;
        const height = 4;
        const imageData = { width, height, data: new Uint8ClampedArray(width * height * 4) } as unknown as ImageData;

        const adapter = new GridFrameDetectionAdapter();
        const config = new GridDetectionConfig(2, 2, 0, 0, 0, 0);

        const frames = adapter.detectFrames(imageData, config);
        expect(frames).toHaveLength(4);

        // expected frames: (0,0),(2,0),(0,2),(2,2) with size 2x2
        const coords = frames.map(r => `${r.x},${r.y},${r.width},${r.height}`);
        expect(coords).toContain('0,0,2,2');
        expect(coords).toContain('2,0,2,2');
        expect(coords).toContain('0,2,2,2');
        expect(coords).toContain('2,2,2,2');
    });

    it('DynamicFrameDetectionAdapter detects a connected opaque component', () => {
        const width = 4;
        const height = 4;
        const data = new Uint8ClampedArray(width * height * 4);

        // set a 2x2 opaque block at (1,1) and (2,1),(1,2),(2,2)
        function setPixel(x: number, y: number, r = 0, g = 0, b = 0, a = 255) {
            const idx = (y * width + x) * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = a;
        }

        setPixel(1, 1);
        setPixel(2, 1);
        setPixel(1, 2);
        setPixel(2, 2);

        const imageData = { width, height, data } as unknown as ImageData;
        const adapter = new DynamicFrameDetectionAdapter();
        const config = new DynamicDetectionConfig(1, 1, 0);

        const frames = adapter.detectFrames(imageData, config);
        expect(frames.length).toBeGreaterThanOrEqual(1);
        // find a rect that matches the 2x2 block at (1,1)
        const match = frames.find(r => r.x === 1 && r.y === 1 && r.width === 2 && r.height === 2);
        expect(match).toBeTruthy();
    });

    it('SpriteSheetLibrary.separateDynamically returns normalized SpriteFrame uv for detected block', () => {
        const width = 4;
        const height = 4;
        const data = new Uint8ClampedArray(width * height * 4);
        function setPixel(x: number, y: number, a = 255) {
            const idx = (y * width + x) * 4;
            data[idx] = 0; data[idx + 1] = 0; data[idx + 2] = 0; data[idx + 3] = a;
        }
        setPixel(1, 1);
        setPixel(2, 1);
        setPixel(1, 2);
        setPixel(2, 2);

        const imageData = { width, height, data } as unknown as ImageData;
        const frames = SpriteSheetLibrary.separateDynamically(imageData, { namingPattern: 'f_{index}' });

        expect(frames).toBeInstanceOf(Array);
        expect(frames.length).toBeGreaterThanOrEqual(1);

        const f = frames[0] as SpriteFrame;
        // uvX should be 1/4 = 0.25, uvY 1/4 = 0.25, uvWidth 2/4 = 0.5, uvHeight 0.5
        expect(f.uvX).toBeCloseTo(0.25);
        expect(f.uvY).toBeCloseTo(0.25);
        expect(f.uvWidth).toBeCloseTo(0.5);
        expect(f.uvHeight).toBeCloseTo(0.5);
    });

    it('SpriteSheetLibrary.separateByGrid returns expected normalized frames for a simple grid', () => {
        const width = 4;
        const height = 4;
        const imageData = { width, height, data: new Uint8ClampedArray(width * height * 4) } as unknown as ImageData;

        const frames = SpriteSheetLibrary.separateByGrid(imageData, 2, 2, { namingPattern: 'g_{index}' });
        expect(frames).toHaveLength(4);
        const first = frames[0];
        expect(first.uvX).toBeCloseTo(0);
        expect(first.uvY).toBeCloseTo(0);
        expect(first.uvWidth).toBeCloseTo(0.5);
        expect(first.uvHeight).toBeCloseTo(0.5);
    });
});
