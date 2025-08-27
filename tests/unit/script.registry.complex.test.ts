import { describe, it, expect } from 'vitest';
import { scriptRegistry } from '../../src/ecs/ScriptRegistry';

import { ScriptInstance } from '../../src/ecs/ScriptComponent';

class VectorScript implements ScriptInstance { public entity?: any; public position = { x: 0, y: 0 }; }

class BodyScript implements ScriptInstance { public entity?: any; public body = { width: 10, height: 20, position: { x: 5, y: 5 }, extra: { foo: 'bar' } }; }

class ColorScript implements ScriptInstance { public entity?: any; public color = { r: 255, g: 128, b: 64, a: 0.5 }; }

describe('ScriptRegistry complex types', () => {
    it('detects vector type automatically', () => {
        scriptRegistry.register('VectorScript', VectorScript);
        const props = scriptRegistry.getScriptProperties('VectorScript');
        expect(props.some(p => p.name === 'position' && p.type === 'vector')).toBe(true);
    });

    it('detects physicsBody type automatically', () => {
        scriptRegistry.register('BodyScript', BodyScript);
        const props = scriptRegistry.getScriptProperties('BodyScript');
        expect(props.some(p => p.name === 'body' && p.type === 'physicsBody')).toBe(true);
    });

    it('detects color type automatically', () => {
        scriptRegistry.register('ColorScript', ColorScript);
        const props = scriptRegistry.getScriptProperties('ColorScript');
        expect(props.some(p => p.name === 'color' && p.type === 'color')).toBe(true);
    });

    it('allows custom type mapper registration', () => {
        // custom mapper for 'vec3' style
        scriptRegistry.registerTypeMapper({
            typeName: 'vec3',
            predicate: (v: any) => v && typeof v === 'object' && typeof v.x === 'number' && typeof v.y === 'number' && typeof v.z === 'number',
            normalize: (v: any) => ({ x: Number(v.x), y: Number(v.y), z: Number(v.z) }),
            priority: 20 // ensure it wins over built-in 'vector' mapper
        });

        class Vec3Script implements ScriptInstance { public entity?: any; public pos = { x: 1, y: 2, z: 3 }; }
        scriptRegistry.register('Vec3Script', Vec3Script);
        const props = scriptRegistry.getScriptProperties('Vec3Script');
        expect(props.some(p => p.name === 'pos' && p.type === 'vec3')).toBe(true);
    });
});
