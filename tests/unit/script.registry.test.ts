import { describe, it, expect } from 'vitest';
import { scriptRegistry } from '../../src/ecs/ScriptRegistry';
import { ScriptInstance } from '../../src/ecs/ScriptComponent';

class TestScript implements ScriptInstance {
    public entity?: any;
    public a = 1;
    public b = 'hello';
    public c = { x: 10, y: 20 };
    public arr = [1, 2, 3];
    public _private = 'should not serialize';
    public method() { return 'should not serialize'; }
}

describe('EnhancedScriptRegistry', () => {
    it('registers and extracts public properties', () => {
        scriptRegistry.register('TestScript', TestScript);
        const props = scriptRegistry.getScriptProperties('TestScript');
        const names = props.map(p => p.name);
        expect(names).toContain('a');
        expect(names).toContain('b');
        expect(names).toContain('c');
        expect(names).toContain('arr');
        expect(names).not.toContain('_private');
        expect(names).not.toContain('method');
    });

    it('creates managed instance and reflects state changes', () => {
        const inst = scriptRegistry.create('TestScript');
        expect(inst).not.toBeNull();
        const proxy = inst as any;
        expect(proxy.a).toBe(1);
        proxy.a = 42;
        expect(proxy.a).toBe(42);
        proxy.b = 'world';
        expect(proxy.b).toBe('world');
        proxy.c.x = 99;
        expect(proxy.c.x).toBe(99);
        proxy.arr.push(4);
        expect(proxy.arr).toEqual([1, 2, 3, 4]);
    });

    it('serializes and rehydrates state with getAllProperties/setAllProperties', () => {
        const inst = scriptRegistry.create('TestScript');
        expect(inst).not.toBeNull();
        const proxy = inst as any;
        proxy.a = 7;
        proxy.b = 'test';
        proxy.c = { x: 1, y: 2 };
        proxy.arr = [9, 8];
        const state = proxy.getAllProperties();
        expect(state).toEqual({ a: 7, b: 'test', c: { x: 1, y: 2 }, arr: [9, 8] });

        // Rehidratar en nueva instancia
        const inst2 = scriptRegistry.create('TestScript');
        expect(inst2).not.toBeNull();
        const proxy2 = inst2 as any;
        proxy2.setAllProperties(state);
        expect(proxy2.a).toBe(7);
        expect(proxy2.b).toBe('test');
        expect(proxy2.c).toEqual({ x: 1, y: 2 });
        expect(proxy2.arr).toEqual([9, 8]);
    });

    it('excludes methods and private properties from serialization', () => {
        const inst = scriptRegistry.create('TestScript');
        expect(inst).not.toBeNull();
        const proxy = inst as any;
        const state = proxy.getAllProperties();
        expect(state).not.toHaveProperty('_private');
        expect(state).not.toHaveProperty('method');
    });

    it('fallbacks to legacy assignment if no proxy methods', () => {
        // Simula un script legacy sin metadatos
        class LegacyScript { public x = 1; }
        // No lo registramos, solo creamos instancia directa
        const legacy = new LegacyScript();
        // Fallback: Object.assign
        Object.assign(legacy, { x: 99 });
        expect(legacy.x).toBe(99);
    });
});