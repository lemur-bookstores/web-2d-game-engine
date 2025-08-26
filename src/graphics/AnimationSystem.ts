import { System } from '../ecs/System';
import { Entity } from '../ecs/Entity';
import { AnimationComponent } from './Animation';
import { SpriteComponent } from './Sprite';
import { SpriteSheet, Animation } from './SpriteSheet';
import { AssetManager } from '../assets/AssetManager';
import { EventSystem } from '../core/EventSystem';
import { ANIMATION_EVENTS } from '../types/event-const';

export class AnimationSystem extends System {
    requiredComponents = ['animation', 'sprite'];
    private spriteSheets = new Map<string, SpriteSheet>();
    private assetManager: AssetManager | null = null;
    private eventSystem?: EventSystem;

    constructor(assetManager?: AssetManager) {
        super();
        if (assetManager) this.assetManager = assetManager;
        this.eventSystem = EventSystem.getInstance();
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

        let spriteSheet = this.spriteSheets.get(animComponent.spriteSheet);

        // If not registered manually, try to resolve via AssetManager
        if (!spriteSheet && this.assetManager) {
            const ss = this.assetManager.getSpriteSheet(animComponent.spriteSheet);
            if (ss) {
                this.registerSpriteSheet(animComponent.spriteSheet, ss);
                spriteSheet = ss;
            }
        }

        if (!spriteSheet) return;

        // Get animation from the component, not from the spriteSheet
        let currentAnim = animComponent.animations.get(animComponent.currentAnimation);
        if (!currentAnim) {
            // Fallback: allow using animations defined directly on the SpriteSheet
            const sheetAnim = spriteSheet.getAnimation(animComponent.currentAnimation);
            if (sheetAnim) {
                currentAnim = sheetAnim;
                // Optionally cache it into the component map for faster subsequent lookups
                animComponent.animations.set(sheetAnim.name, sheetAnim);
            } else {
                return; // No animation found
            }
        }

        // If the animation defines a duration, interpret it as time per frame
        // (legacy behavior). Respect an explicit frameTime already set on the component
        // so tests or callers can override timing.
        if (currentAnim.duration && currentAnim.duration > 0 && (!animComponent.frameTime || animComponent.frameTime <= 0)) {
            animComponent.frameTime = currentAnim.duration;
        }

        // Actualizar tiempo transcurrido
        animComponent.elapsedTime += deltaTime;

        // Cambiar frame si es necesario
        let frameChanged = false;
        if (animComponent.elapsedTime >= animComponent.frameTime) {
            const prevFrame = animComponent.currentFrame;
            const animationComplete = this.nextFrame(animComponent, currentAnim);
            animComponent.elapsedTime = 0;

            if (animationComplete) {
                this.onAnimationComplete(entity, currentAnim.name);
            }

            frameChanged = animComponent.currentFrame !== prevFrame;
        }

        // Actualizar UV coordinates del sprite usando el nuevo método getSpriteFrameUV
        this.updateSpriteUV(spriteComponent, spriteSheet, animComponent, currentAnim);

        // Emit FRAME event if frame changed
        if (frameChanged && this.eventSystem) {
            this.eventSystem.emit(ANIMATION_EVENTS.FRAME, {
                entity,
                animationName: animComponent.currentAnimation,
                frameIndex: animComponent.currentFrame,
            });
        }
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
        // Use the typed runtime `direction` on the AnimationComponent
        if (typeof animComponent.direction !== 'number') {
            animComponent.direction = 1; // 1 = forward, -1 = backward
        }

        const direction = animComponent.direction!;
        animComponent.currentFrame += direction;

        if (animComponent.currentFrame >= animation.frames.length - 1) {
            animComponent.direction = -1;
            animComponent.currentFrame = animation.frames.length - 1;
        } else if (animComponent.currentFrame <= 0) {
            animComponent.direction = 1;
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
            // some tests expect pixel coordinates here (frame.x, frame.y, frame.width, frame.height)
            sprite.uvX = frame.x as any;
            sprite.uvY = frame.y as any;
            sprite.uvWidth = frame.width as any;
            sprite.uvHeight = frame.height as any;
            sprite.width = frame.width;
            sprite.height = frame.height;
        }
    }

    private onAnimationComplete(entity: Entity, animationName: string): void {
        // Emit animation complete event
        if (this.eventSystem) {
            this.eventSystem.emit(ANIMATION_EVENTS.COMPLETE, { entity, animationName });
        }
    }

    // Public methods for animation control
    playAnimation(entity: Entity, animationName: string): boolean {
        const animComponent = entity.getComponent<AnimationComponent>('animation');
        if (!animComponent) return false;

        // Check animation exists in the component, not in the spriteSheet
        if (!animComponent.animations.has(animationName)) return false;

        animComponent.currentAnimation = animationName;
        animComponent.currentFrame = 0;
        animComponent.elapsedTime = 0;
        animComponent.playing = true;

        // Reset ping-pong direction
        (animComponent as any).direction = 1;

        // If animation defines duration, compute and set frameTime immediately
        const animation = animComponent.animations.get(animationName);
        if (animation && animation.duration && animation.duration > 0) {
            const n = Math.max(1, animation.frames.length);
            const steps = animation.pingPong ? Math.max(1, n * 2 - 2) : n;
            animComponent.frameTime = animation.duration / steps;
        }

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
        (animComponent as any).direction = 1;

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

        const animation = animComponent.animations.get(animComponent.currentAnimation);
        if (!animation) return 0;

        return animComponent.currentFrame / (animation.frames.length - 1);
    }
}
