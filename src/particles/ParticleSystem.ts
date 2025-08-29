import { System } from '../ecs/System';
import { Entity } from '../ecs/Entity';
import { ParticleComponent } from './ParticleComponent';

export class ParticleSystem extends System {
    readonly requiredComponents: string[] = [];

    private particles: any[] = [];

    constructor() {
        super();
    }

    update(_entities: Entity[], deltaTime: number): void {
        // Simple emitter processing: decrement life, spawn new particles based on emissionRate
        for (const p of this.particles) {
            p.life -= deltaTime;
        }

        // remove dead
        this.particles = this.particles.filter(p => p.life > 0);
    }

    // Attach a particle emitter to an entity
    attachEmitter(entity: Entity, component: ParticleComponent) {
        // For now just push a lightweight emitter record
        this.particles.push({ entityId: entity.id, emitter: component, life: component.lifetime });
    }
}
