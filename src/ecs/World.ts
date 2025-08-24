import { Entity } from './Entity';
import { System } from './System';
import { EventSystem } from '../core/EventSystem';
import { WORLD_EVENTS } from '@/types/event-const';

export class World {
    private entities: Map<string, Entity>;
    private systems: System[];
    private eventSystem: EventSystem;

    constructor() {
        this.entities = new Map();
        this.systems = [];
        this.eventSystem = EventSystem.getInstance();
    }

    createEntity(): Entity {
        const entity = new Entity();
        this.entities.set(entity.id, entity);
        this.eventSystem.emit(WORLD_EVENTS.ENTITY_CREATED, { entity });
        return entity;
    }

    removeEntity(entityId: string): void {
        const entity = this.entities.get(entityId);
        if (entity) {
            entity.destroy();
            this.entities.delete(entityId);
            this.eventSystem.emit(WORLD_EVENTS.ENTITY_DESTROYED, { entityId });
        }
    }

    addSystem(system: System): void {
        this.systems.push(system);
    }

    removeSystem(system: System): void {
        const index = this.systems.indexOf(system);
        if (index !== -1) {
            this.systems.splice(index, 1);
        }
    }

    update(deltaTime: number): void {
        const activeEntities = Array.from(this.entities.values()).filter(entity => entity.active);
        this.systems.forEach(system => system.update(activeEntities, deltaTime));
    }

    getEntity(entityId: string): Entity | undefined {
        return this.entities.get(entityId);
    }

    getEntities(): Entity[] {
        return Array.from(this.entities.values());
    }

    getActiveEntities(): Entity[] {
        return this.getEntities().filter(entity => entity.active);
    }

    clear(): void {
        this.entities.clear();
        this.systems = [];
        this.eventSystem.emit(WORLD_EVENTS.WORLD_CLEARED, {});
    }

    on(eventName: AllEventTypes, callback: Function): void {
        this.eventSystem.on(eventName, callback as any);
    }

    off(eventName: AllEventTypes, callback: Function): void {
        this.eventSystem.off(eventName, callback as any);
    }
}
