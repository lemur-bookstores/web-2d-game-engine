import { ParticleComponent } from './ParticleComponent';

export class BasicEmitter implements ParticleComponent {
    type = 'basic';
    color = { r: 255, g: 255, b: 255, a: 1 };
    lifetime = 1.0;
    emissionRate = 10;
    speed = 50;
    spread = Math.PI / 8;
    size = 4;
    gravity = { x: 0, y: 0 };
    layer = 'default';
    layerMask = 0;
    visible = true;
}
