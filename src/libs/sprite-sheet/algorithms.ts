export class UnionFind {
    private parent: number[];
    private rank: number[];

    constructor(size: number) {
        this.parent = Array.from({ length: size }, (_, i) => i);
        this.rank = new Array(size).fill(0);
    }

    find(x: number): number {
        if (this.parent[x] !== x) {
            this.parent[x] = this.find(this.parent[x]);
        }
        return this.parent[x];
    }

    union(x: number, y: number): void {
        const rootX = this.find(x);
        const rootY = this.find(y);

        if (rootX !== rootY) {
            if (this.rank[rootX] < this.rank[rootY]) {
                this.parent[rootX] = rootY;
            } else if (this.rank[rootX] > this.rank[rootY]) {
                this.parent[rootY] = rootX;
            } else {
                this.parent[rootY] = rootX;
                this.rank[rootX]++;
            }
        }
    }
}

export class ConnectedComponentsAlgorithm {
    findComponents(pixels: Set<number>, imageWidth: number): number[][] {
        const pixelArray = Array.from(pixels);
        const pixelToIndex = new Map<number, number>();
        const unionFind = new UnionFind(pixelArray.length);

        pixelArray.forEach((pixel, index) => {
            pixelToIndex.set(pixel, index);
        });

        for (const pixel of pixels) {
            const neighbors = this.getNeighbors(pixel, imageWidth, pixels);
            const currentIndex = pixelToIndex.get(pixel)!;

            for (const neighbor of neighbors) {
                const neighborIndex = pixelToIndex.get(neighbor)!;
                unionFind.union(currentIndex, neighborIndex);
            }
        }

        const components = new Map<number, number[]>();
        pixelArray.forEach((pixel, index) => {
            const root = unionFind.find(index);
            if (!components.has(root)) components.set(root, []);
            components.get(root)!.push(pixel);
        });

        return Array.from(components.values());
    }

    private getNeighbors(pixel: number, imageWidth: number, validPixels: Set<number>): number[] {
        const x = pixel % imageWidth;
        const y = Math.floor(pixel / imageWidth);
        const neighbors: number[] = [];
        const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

        for (const [dx, dy] of directions) {
            const newX = x + dx;
            const newY = y + dy;

            if (newX >= 0 && newY >= 0) {
                const newPixel = newY * imageWidth + newX;
                if (validPixels.has(newPixel)) neighbors.push(newPixel);
            }
        }
        return neighbors;
    }
}
