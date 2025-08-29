import { describe, it, expect } from 'vitest';
import { RenderSystem } from '../../src/graphics/RenderSystem';
import { Canvas2DRenderer } from '../../src/graphics/Canvas2DRenderer';

describe('RenderSystem mappers', () => {
    it('can register and expose renderer mapper types', () => {
        const renderer = new Canvas2DRenderer();
        const rs = new RenderSystem(renderer as any);
        rs.registerRendererMapper('material', (v: any) => v && v.shader, (v: any) => ({ shader: v.shader }));
        const types = rs.getRegisteredRendererTypes();
        expect(types).toEqual(expect.arrayContaining(['material']));
        const normalized = rs.normalizeRendererData('material', { shader: 'basic' });
        expect(normalized).toHaveProperty('shader', 'basic');
    });
});
