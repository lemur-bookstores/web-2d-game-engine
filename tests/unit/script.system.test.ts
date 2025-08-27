import { describe, it, expect, beforeEach } from 'vitest';
import { Entity } from '../../src/ecs/Entity';
import { scriptRegistry } from '../../src/ecs/ScriptRegistry';
import { ScriptSystem } from '../../src/ecs/ScriptSystem';
import { createScriptComponent } from '../../src/ecs/ScriptComponent';
import { EventSystem } from '../../src/core/EventSystem';
import { SCENE_EVENTS } from '../../src/types/event-const';

class TestScript {
    public initialized = false;
    public updates = 0;
    public entity: any;
    constructor(entity?: any) { this.entity = entity; }
    init() { this.initialized = true; }
    update(dt: number) { this.updates += 1; }
    toJSON() { return { updates: this.updates }; }
    fromJSON(data: any) { if (data?.updates) this.updates = data.updates; }
}

describe('ScriptSystem', () => {
    beforeEach(() => {
        // ensure registry is clean for test
        // there's no clear method; re-register under a unique name
        scriptRegistry.register('testscript', TestScript as any);
    });

    it('initializes and updates script instances', () => {
        const e = new Entity('e1');
        e.addComponent(createScriptComponent('testscript'));

        const ss = new ScriptSystem();
        ss.update([e], 1 / 60);

        const sc = e.getComponent('script') as any;
        expect(sc.instance).toBeDefined();
        expect((sc.instance as any).initialized).toBe(true);

        // call update again and ensure update was invoked
        ss.update([e], 1 / 60);
        expect((sc.instance as any).updates).toBeGreaterThanOrEqual(1);
    });

    it('rehydrates state from component.state', () => {
        const e = new Entity('e2');
        const comp = createScriptComponent('testscript', { updates: 3 });
        e.addComponent(comp as any);

        const ss = new ScriptSystem();
        ss.update([e], 1 / 60);

        const sc = e.getComponent('script') as any;
        expect(sc.instance).toBeDefined();
        expect((sc.instance as any).updates).toBeGreaterThanOrEqual(3);
    });

    it('calls destroy on instance when entity removed event is emitted', () => {
        const e = new Entity('e3');
        e.addComponent(createScriptComponent('testscript'));

        const ss = new ScriptSystem();
        ss.initialize?.();
        ss.update([e], 1 / 60);

        const sc = e.getComponent('script') as any;
        expect(sc.instance).toBeDefined();

        // spy on destroy
        let destroyed = false;
        (sc.instance as any).destroy = () => { destroyed = true; };

        const ev = EventSystem.getInstance();
        ev.emit(SCENE_EVENTS.ENTITY_REMOVED, { scene: null, entity: e, entityId: e.id });

        // process queued events (test env processes immediately)
        ev.processEvents?.();

        expect(destroyed).toBe(true);
        ss.destroy();
    });
});
