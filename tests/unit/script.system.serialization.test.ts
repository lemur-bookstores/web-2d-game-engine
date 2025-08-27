import { describe, it, expect } from 'vitest';
import { ScriptSystem } from '../../src/ecs/ScriptSystem';
import { scriptRegistry } from '../../src/ecs/ScriptRegistry';
import { Entity } from '../../src/ecs/Entity';
import { EventSystem } from '../../src/core/EventSystem';
import { SCENE_EVENTS } from '../../src/types/event-const';

class SaveableScript {
    public entity?: any;
    public speed = 10;
    public position = { x: 1, y: 2 };
    init() { }
    update(dt: number) { this.position.x += dt * this.speed; }
}

describe('ScriptSystem serialization integration', () => {
    it('rehydrates state from component.state when creating instance', () => {
        scriptRegistry.register('SaveableScript', SaveableScript);

        const e = new Entity('s1');
        e.addComponent({ type: 'script', scripts: [{ scriptName: 'SaveableScript', state: { speed: 50, position: { x: 5, y: 6 } } }] } as any);

        const ss = new ScriptSystem();
        // Use dt=0 to create instance without moving it during this assertion
        ss.update([e], 0);

        const sc = e.getComponent('script') as any;
        const inst = sc.scripts[0].instance as any;
        expect(inst).toBeDefined();
        expect(inst.speed).toBe(50);
        expect(inst.position).toEqual({ x: 5, y: 6 });
    });

    it('persists state on entity removed event', () => {
        const e = new Entity('s2');
        e.addComponent({ type: 'script', scripts: [{ scriptName: 'SaveableScript' }] } as any);

        const ss = new ScriptSystem();
        ss.initialize?.();
        ss.update([e], 1 / 60);

        const sc = e.getComponent('script') as any;
        const inst = sc.scripts[0].instance as any;
        // modify runtime state
        inst.speed = 77;
        inst.position = { x: 9, y: 9 };

        // emit entity removed
        const es = EventSystem.getInstance();
        es.emit(SCENE_EVENTS.ENTITY_REMOVED, { entity: e });

        // after removal, component state should be updated
        expect(sc.scripts[0].state).toBeDefined();
        expect(sc.scripts[0].state.speed).toBe(77);
        expect(sc.scripts[0].state.position).toEqual({ x: 9, y: 9 });

        ss.destroy();
    });
});
