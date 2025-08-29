import { describe, expect, test } from 'vitest';
import { SpriteSheet } from '../../src/graphics/SpriteSheet';
import { Texture } from '../../src/graphics/Texture';

// Create a fake image element for Texture constructor
function makeImage(w = 64, h = 32, src = 'data:fake.png') {
    const img = {
        width: w,
        height: h,
        src,
        complete: true,
    } as unknown as HTMLImageElement;
    return img;
}

describe('SpriteSheet atlas roundtrip', () => {
    test('toAtlas -> fromAtlas preserves frames and ids', () => {
        const img = makeImage(64, 32);
        const tex = new Texture(img);

        // create sprite sheet with two frames
        const sheet = new SpriteSheet(tex, 32, 32);

        // there should be 2 frames generated
        expect(sheet.getFrameCount()).toBe(2);

        const atlas = sheet.toAtlas();
        expect(atlas.frames.length).toBe(2);

        // import back
        const sheet2 = SpriteSheet.fromAtlas(tex, atlas as any);
        expect(sheet2.getFrameCount()).toBe(2);

        const frames1 = sheet.listFrames();
        const frames2 = sheet2.listFrames();

        // ids should be present and unique
        expect(frames1[0].id).toBeDefined();
        expect(frames1[1].id).toBeDefined();
        expect(frames1[0].id).not.toBe(frames1[1].id);

        // exported frames should contain ids
        expect(atlas.frames[0].id).toBe(frames1[0].id);

        // when importing, frames ids should be preserved
        expect(frames2[0].id).toBe(frames1[0].id);
        expect(frames2[1].id).toBe(frames1[1].id);
    });
});
