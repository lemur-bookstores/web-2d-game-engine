export interface Component {
    type: string;
    [key: string]: any;
}

export interface TransformComponent extends Component {
    type: 'transform';
    position: { x: number; y: number };
    rotation: number;
    scale: { x: number; y: number };
}

export interface SpriteComponent extends Component {
    type: 'sprite';
    texture: string;
    width: number;
    height: number;
    tint: { r: number; g: number; b: number; a: number };
    uvX: number;
    uvY: number;
    uvWidth: number;
    uvHeight: number;
    flipX: boolean;
    flipY: boolean;
}

export interface PhysicsComponent extends Component {
    type: 'physics';
    bodyType: 'static' | 'dynamic' | 'kinematic';
    shape: 'box' | 'circle' | 'polygon';
    density: number;
    friction: number;
    restitution: number;
    velocity: { x: number; y: number };
    angularVelocity: number;
}

export interface ColliderComponent extends Component {
    type: 'collider';
    width: number;
    height: number;
    isTrigger: boolean;
}
