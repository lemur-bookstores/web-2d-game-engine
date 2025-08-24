import { System } from '../ecs/System';
import { Entity } from '../ecs/Entity';
import { AudioManager } from './AudioManager';
import { EventSystem } from '../core/EventSystem';
import { ANIMATION_EVENTS } from '../types/event-const';
import { AnimationComponent } from '../graphics/Animation';

export interface AudioComponent {
    type: 'audio';
    clip: string;
    loop?: boolean;
    volume?: number;
    group?: string;
    autoplay?: boolean;
    playingHandle?: any;
    // Play this clip when the entity's animation hits a frame
    autoplayOnFrame?: boolean;
    // If set, only trigger when frameIndex equals this value
    triggerFrame?: number;
}

export class AudioSystem extends System {
    requiredComponents = ['audio'];
    private audioManager = AudioManager.getInstance();
    private eventSystem = EventSystem.getInstance();

    update(entities: Entity[], _deltaTime: number): void {
        const audioEntities = this.getEntitiesWithComponents(entities, this.requiredComponents);

        audioEntities.forEach(entity => {
            const audio = entity.getComponent<AudioComponent>('audio');
            if (!audio) return;

            // Autoplay behavior
            if (audio.autoplay && !audio.playingHandle && this.audioManager.has(audio.clip)) {
                const handle = this.audioManager.play(audio.clip, { loop: !!audio.loop, volume: audio.volume, group: audio.group });
                audio.playingHandle = handle;
            }

            // If clip not loaded, try to load lazily (no await here)
            if (!this.audioManager.has(audio.clip)) {
                // best-effort load (fire-and-forget)
                this.audioManager.loadAudio(audio.clip, `assets/${audio.clip}`)
                    .catch(err => console.warn('Failed to load audio', audio.clip, err));
            }
        });
    }

    constructor() {
        super();

        // Listen for animation frame events and play audio if entity has an audio component configured
        this.eventSystem.on(ANIMATION_EVENTS.FRAME, (evt: any) => {
            try {
                const data = evt.data || {};
                const entity: Entity | undefined = data.entity;
                const frameIndex: number | undefined = data.frameIndex;

                if (!entity) return;

                // First, check if the entity's animation component maps this frame to a sfx
                const anim = entity.getComponent<AnimationComponent>('animation');
                if (anim && anim.frameSfx && typeof frameIndex === 'number') {
                    const clip = anim.frameSfx[frameIndex];
                    if (clip) {
                        this.audioManager.play(clip, {});
                    }
                }

                // Then, if an audio component explicitly wants to trigger on frames, honor it
                const audio = entity.getComponent<AudioComponent>('audio');
                if (audio && audio.autoplayOnFrame) {
                    if (typeof audio.triggerFrame === 'number') {
                        if (audio.triggerFrame !== frameIndex) return;
                    }

                    // fire-and-forget play for SFX; don't store handle unless looping
                    const handle = this.audioManager.play(audio.clip, { loop: !!audio.loop, volume: audio.volume, group: audio.group });
                    if (audio.loop) audio.playingHandle = handle;
                }
            } catch (e) {
                // swallow to avoid crashing game loop
                console.warn('Error in AudioSystem FRAME handler', e);
            }
        });
    }

    // Public API convenience methods
    play(entity: Entity): boolean {
        const audio = entity.getComponent<AudioComponent>('audio');
        if (!audio) return false;
        const handle = this.audioManager.play(audio.clip, { loop: !!audio.loop, volume: audio.volume, group: audio.group });
        audio.playingHandle = handle;
        return !!handle;
    }

    stop(entity: Entity): boolean {
        const audio = entity.getComponent<AudioComponent>('audio');
        if (!audio) return false;
        if (audio.playingHandle) {
            this.audioManager.stop(audio.playingHandle);
            audio.playingHandle = undefined;
            return true;
        }
        this.audioManager.stop(audio.clip);
        return true;
    }
}
