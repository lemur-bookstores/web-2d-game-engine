import { System } from '../ecs/System';
import { Entity } from '../ecs/Entity';
import { ParticleComponent } from './ParticleComponent';
import { ParticleRegistry } from './ParticleRegistry';
import { Scene } from '../core/Scene';

export class ParticleSystem extends System {
    readonly requiredComponents: string[] = [];

    // active particle instances
    private particles: any[] = [];
    // emitters linked to entities
    private emitters: { entityId: string; component: ParticleComponent; accumulator: number }[] = [];

    private pool: any[] = [];

    constructor() {
        super();
    }

    setScene(scene: Scene | undefined) {
        if (scene) {
            ParticleRegistry.getInstance().setLayerResolver((name: string) => scene.getLayer(name)?.bit);
        } else {
            ParticleRegistry.getInstance().setLayerResolver(undefined);
        }
    }

    update(entities: Entity[], deltaTime: number): void {
        // update emitters (spawn particles according to emissionRate)
        for (const emitter of this.emitters) {
            const acc = emitter.accumulator + emitter.component.emissionRate * deltaTime;
            const toSpawn = Math.floor(acc);
            emitter.accumulator = acc - toSpawn;

            if (toSpawn > 0) {
                // find entity position via transform component if present
                const ent = entities.find(e => e.id === emitter.entityId);
                let px = 0, py = 0;
                if (ent) {
                    const t = ent.getComponent<any>('transform');
                    if (t && t.position) {
                        px = t.position.x ?? 0;
                        py = t.position.y ?? 0;
                    }
                }

                for (let i = 0; i < toSpawn; i++) {
                    this.spawnParticle(px, py, emitter.component);
                }
            }
        }

        // update particles physics/lifetime
        for (const p of this.particles) {
            p.life -= deltaTime;
            p.vy += (p.gravityY ?? 0) * deltaTime;
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
        }

        // reclaim dead
        const alive = [] as typeof this.particles;
        for (const p of this.particles) {
            if (p.life > 0) alive.push(p);
            else this.pool.push(p);
        }
        this.particles = alive;
    }

    attachEmitter(entity: Entity, component: ParticleComponent) {
        this.emitters.push({ entityId: entity.id, component, accumulator: 0 });
    }

    attachEmitterFromSerialized(entity: Entity, serialized: any) {
        const comp = ParticleRegistry.getInstance().deserializeEmitter(serialized) as ParticleComponent;
        this.attachEmitter(entity, comp);
    }

    private spawnParticle(x: number, y: number, comp: ParticleComponent) {
        const p = this.pool.pop() || {};
        const angle = (Math.random() - 0.5) * comp.spread;
        const speed = comp.speed * (0.8 + Math.random() * 0.4);
        p.x = x;
        p.y = y;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
    p.life = comp.lifetime;
    p.size = comp.size;
    p.color = comp.color;
    p.texture = comp.texture;
        p.gravityY = comp.gravity?.y ?? 0;
        this.particles.push(p);
    }

    // Expose particle count for tests/inspector
    getParticleCount() {
        return this.particles.length;
    }

    // Provide read-only snapshot for renderer
    getParticlesForRender() {
        // return shallow copies (x,y,size,color)
        return this.particles.map(p => ({ x: p.x, y: p.y, size: p.size, color: p.color, texture: p.texture }));
    }
}
