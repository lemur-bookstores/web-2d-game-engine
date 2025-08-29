import { describe, it, expect } from 'vitest';
import { Entity } from '../../src/ecs/Entity';
import { scriptRegistry } from '../../src/ecs/ScriptRegistry';
import { ScriptSystem } from '../../src/ecs/ScriptSystem';
import { createScriptComponent } from '../../src/ecs/ScriptComponent';

class FirstScript { init() { }; update(_dt: number) { }; destroy() { } }
class SecondScript { init() { }; update(_dt: number) { }; destroy() { } }

describe('ScriptSystem multiple and error handling', () => {
    it('supports multiple scripts on the same entity via scripts array', () => {
        scriptRegistry.register('first', FirstScript as any);
        scriptRegistry.register('second', SecondScript as any);

        const e = new Entity('multi');
        // Use the new scripts array to attach multiple script entries
        e.addComponent({ type: 'script', scripts: [{ scriptName: 'first' }, { scriptName: 'second' }] } as any);

        const ss = new ScriptSystem();
        ss.update([e], 1 / 60);
        const sc = e.getComponent('script') as any;
        expect(Array.isArray(sc.scripts)).toBe(true);
        expect(sc.scripts[0].instance).toBeDefined();
        expect(sc.scripts[1].instance).toBeDefined();
    });

    it('handles errors thrown by script init/update gracefully', () => {
        class BadScript { init() { throw new Error('boom'); } update(_dt: number) { throw new Error('boom update'); } }
        scriptRegistry.register('bad', BadScript as any);

        const e = new Entity('bad');
        e.addComponent(createScriptComponent('bad'));

        const ss = new ScriptSystem();
        // Should not throw when update is called
        expect(() => ss.update([e], 1 / 60)).not.toThrow();
    });
});
