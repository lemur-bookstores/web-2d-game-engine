import { Entity } from './Entity';

export abstract class System {
    abstract readonly requiredComponents: string[];

    abstract update(entities: Entity[], deltaTime: number): void;

    protected getEntitiesWithComponents(entities: Entity[], components: string[]): Entity[] {
        return entities.filter(entity =>
            entity.active && components.every(comp => entity.hasComponent(comp))
        );
    }

    protected filterInactiveEntities(entities: Entity[]): Entity[] {
        return entities.filter(entity => entity.active);
    }
}
