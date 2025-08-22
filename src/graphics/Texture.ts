export class Texture {
    public readonly width: number;
    public readonly height: number;
    private image: HTMLImageElement;

    constructor(image: HTMLImageElement) {
        this.image = image;
        this.width = image.width;
        this.height = image.height;
    }

    getImage(): HTMLImageElement {
        return this.image;
    }

    dispose(): void {
        // En WebGL, aquí liberaríamos la textura de la GPU
        // Por ahora solo eliminamos la referencia a la imagen
        (this.image as any) = null;
    }
}
