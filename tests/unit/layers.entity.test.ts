import { describe, it, expect } from 'vitest';
import { Entity } from '../../src/ecs/Entity';
import { Scene } from '../../src/core/Scene';

describe('Entity layer assignment', () => {
    it('defaults to "default" layer and allows setting/getting layer', () => {
        const e = new Entity('test-1');
        expect(e.getLayer()).toBe('default');
        e.setLayer('player');
        expect(e.getLayer()).toBe('player');
        e.setLayer(0x0008);
        expect(e.getLayer()).toBe(0x0008);
    });
});

describe('Scene layer mask resolution', () => {
    it('returns correct mask for existing layers', () => {
        const scene = new Scene('s1');
        const mask = scene.getLayerMask(['player', 'ground']);
        // player 0x0002 | ground 0x0008 = 0x000A (10)
        expect(mask).toBe(0x0002 | 0x0008);
    });
});
