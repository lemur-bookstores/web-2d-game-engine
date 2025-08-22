import { System } from '../ecs/System';
import { Entity } from '../ecs/Entity';
import { AnimationComponent } from './Animation';
import { SpriteComponent } from './Sprite';
import { SpriteSheet, Animation } from './SpriteSheet';

export class AnimationSystem extends System {
    requiredComponents = ['animation', 'sprite'];
    private spriteSheets = new Map<string, SpriteSheet>();

    constructor() {
        super();
    }

    registerSpriteSheet(name: string, spriteSheet: SpriteSheet): void {
        this.spriteSheets.set(name, spriteSheet);
    }

    unregisterSpriteSheet(name: string): void {
        this.spriteSheets.delete(name);
    }

    getSpriteSheet(name: string): SpriteSheet | undefined {
        return this.spriteSheets.get(name);
    }

    update(entities: Entity[], deltaTime: number): void {
        const animatedEntities = this.getEntitiesWithComponents(
            entities,
            this.requiredComponents
        );

        animatedEntities.forEach((entity) => {
            this.updateAnimation(entity, deltaTime);
        });
    }

    private updateAnimation(entity: Entity, deltaTime: number): void {
        const animComponent = entity.getComponent<AnimationComponent>('animation');
        const spriteComponent = entity.getComponent<SpriteComponent>('sprite');

        if (!animComponent || !spriteComponent || !animComponent.playing) return;

        const spriteSheet = this.spriteSheets.get(animComponent.spriteSheet);
        if (!spriteSheet) return;

        const currentAnim = spriteSheet.getAnimation(animComponent.currentAnimation);
        if (!currentAnim) return;

        // Actualizar tiempo transcurrido
        animComponent.elapsedTime += deltaTime;

        // Cambiar frame si es necesario
        if (animComponent.elapsedTime >= animComponent.frameTime) {
            const animationComplete = this.nextFrame(animComponent, currentAnim);
            animComponent.elapsedTime = 0;

            if (animationComplete) {
                this.onAnimationComplete(entity, currentAnim.name);
            }
        }

        // Actualizar UV coordinates del sprite
        this.updateSpriteUV(spriteComponent, spriteSheet, animComponent, currentAnim);
    }

    private nextFrame(animComponent: AnimationComponent, animation: Animation): boolean {
        if (animation.pingPong) {
            return this.updatePingPongFrame(animComponent, animation);
        } else {
            return this.updateNormalFrame(animComponent, animation);
        }
    }

    private updateNormalFrame(animComponent: AnimationComponent, animation: Animation): boolean {
        animComponent.currentFrame++;

        if (animComponent.currentFrame >= animation.frames.length) {
            if (animation.loop) {
                animComponent.currentFrame = 0;
            } else {
                animComponent.currentFrame = animation.frames.length - 1;
                animComponent.playing = false;
                return true; // Animation completed
            }
        }

        return false;
    }

    private updatePingPongFrame(animComponent: AnimationComponent, animation: Animation): boolean {
        // Usar una propiedad temporal para la dirección
        if (!(animComponent as any)._direction) {
            (animComponent as any)._direction = 1; // 1 = forward, -1 = backward
        }

        const direction = (animComponent as any)._direction;
        animComponent.currentFrame += direction;

        if (animComponent.currentFrame >= animation.frames.length - 1) {
            (animComponent as any)._direction = -1;
            animComponent.currentFrame = animation.frames.length - 1;
        } else if (animComponent.currentFrame <= 0) {
            (animComponent as any)._direction = 1;
            animComponent.currentFrame = 0;

            if (!animation.loop) {
                animComponent.playing = false;
                return true; // Animation completed
            }
        }

        return false;
    }

    private updateSpriteUV(
        sprite: SpriteComponent,
        spriteSheet: SpriteSheet,
        animComponent: AnimationComponent,
        animation: Animation
    ): void {
        const frameIndex = animation.frames[animComponent.currentFrame];
        const frame = spriteSheet.getFrame(frameIndex);

        if (frame) {
            sprite.uvX = frame.x;
            sprite.uvY = frame.y;
            sprite.uvWidth = frame.width;
            sprite.uvHeight = frame.height;
            sprite.width = frame.width;
            sprite.height = frame.height;
        }
    }

    private onAnimationComplete(entity: Entity, animationName: string): void {
        // Emit animation complete event
        // This would integrate with the event system when available
        console.log(`Animation '${animationName}' completed for entity ${entity.id}`);
    }

    // Public methods for animation control
    playAnimation(entity: Entity, animationName: string): boolean {
        const animComponent = entity.getComponent<AnimationComponent>('animation');
        if (!animComponent) return false;

        const spriteSheet = this.spriteSheets.get(animComponent.spriteSheet);
        if (!spriteSheet || !spriteSheet.getAnimation(animationName)) return false;

        animComponent.currentAnimation = animationName;
        animComponent.currentFrame = 0;
        animComponent.elapsedTime = 0;
        animComponent.playing = true;

        // Reset ping-pong direction
        (animComponent as any)._direction = 1;

        return true;
    }

    pauseAnimation(entity: Entity): boolean {
        const animComponent = entity.getComponent<AnimationComponent>('animation');
        if (!animComponent) return false;

        animComponent.playing = false;
        return true;
    }

    resumeAnimation(entity: Entity): boolean {
        const animComponent = entity.getComponent<AnimationComponent>('animation');
        if (!animComponent) return false;

        animComponent.playing = true;
        return true;
    }

    stopAnimation(entity: Entity): boolean {
        const animComponent = entity.getComponent<AnimationComponent>('animation');
        if (!animComponent) return false;

        animComponent.playing = false;
        animComponent.currentFrame = 0;
        animComponent.elapsedTime = 0;
        (animComponent as any)._direction = 1;

        return true;
    }

    setAnimationSpeed(entity: Entity, speed: number): boolean {
        const animComponent = entity.getComponent<AnimationComponent>('animation');
        if (!animComponent) return false;

        animComponent.frameTime = speed;
        return true;
    }

    getCurrentAnimationName(entity: Entity): string | null {
        const animComponent = entity.getComponent<AnimationComponent>('animation');
        return animComponent ? animComponent.currentAnimation : null;
    }

    isAnimationPlaying(entity: Entity): boolean {
        const animComponent = entity.getComponent<AnimationComponent>('animation');
        return animComponent ? animComponent.playing : false;
    }

    getAnimationProgress(entity: Entity): number {
        const animComponent = entity.getComponent<AnimationComponent>('animation');
        if (!animComponent) return 0;

        const spriteSheet = this.spriteSheets.get(animComponent.spriteSheet);
        if (!spriteSheet) return 0;

        const animation = spriteSheet.getAnimation(animComponent.currentAnimation);
        if (!animation) return 0;

        return animComponent.currentFrame / (animation.frames.length - 1);
    }
}
