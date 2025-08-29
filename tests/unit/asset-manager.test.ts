import { describe, it, expect, beforeEach } from 'vitest';
import { AssetManager } from '../../src/assets/AssetManager';

describe('AssetManager mappers', () => {
    let am: AssetManager;
    beforeEach(() => {
        // ensure singleton is freshish by accessing instance
        am = AssetManager.getInstance();
    });

    it('exposes built-in asset types and can normalize texture data', () => {
        const types = am.getRegisteredAssetTypes();
        expect(Array.isArray(types)).toBe(true);
        // built-in should include 'texture' and 'spritesheet'
        expect(types).toEqual(expect.arrayContaining(['texture', 'spritesheet', 'audio', 'json']));

        const normalized = am.normalizeAssetData('texture', { width: 32, height: 16 });
        expect(normalized).toHaveProperty('width', 32);
        expect(normalized).toHaveProperty('height', 16);
    });
});
