import Vector3 from "./Vector3.js";

const CURRENT_POINT = new Vector3();
const BEST_POINT = new Vector3();

export default class PoissonDiskSampler {
  constructor({
    width,
    height,
    depth = 0,
    radius,
    maxPoints = Infinity,
  }) {
    this.points = new Set([new Vector3()]);

    this._width = width;
    this._height = height;
    this._depth = depth;
    this._radius = radius;
    this._maxPoints = maxPoints;

    this.fill();
  }

  fill({
    width = this._width,
    height = this._height,
    depth = this._depth,
    radius = this._radius,
    maxPoints = this._maxPoints,
  } = {}) {
    const halfWidth = width * .5;
    const halfHeight = height * .5;
    const halfDepth = depth * .5;

    let step = 0;

    const squaredRadius = radius * radius;

    const grid = [];
    for (const point of this.points) {
      const column = Math.floor(point.x / this._radius);
      const row = Math.floor(point.y / this._radius);
      if (!grid[column]) {
        grid[column] = [];
      }
      if (!grid[column][row]) {
        grid[column][row] = [];
      }
      grid[column][row].push(point);
    }

    while (step < 100) {
      let distanceOk = true;
      for (let index = 0; index < 10; index++) {
        CURRENT_POINT.set(
          (Math.random() * 2 - 1) * halfWidth,
          (Math.random() * 2 - 1) * halfHeight,
          (Math.random() * 2 - 1) * halfDepth,
        );
        const column = Math.floor(CURRENT_POINT.x / this._radius);
        const row = Math.floor(CURRENT_POINT.y / this._radius);
        const points = [];
        for (let columnOffset = -1; columnOffset < 2; columnOffset++) {
          for (let rowOffset = -1; rowOffset < 2; rowOffset++) {
            const currentColumn = column + columnOffset;
            const currentRow = row + rowOffset;
            if (grid[currentColumn] && grid[currentColumn][currentRow]) {
              points.push(...grid[currentColumn][currentRow]);
            }
          }
        }
        distanceOk = true;
        for (const point of points) {
          const currentDistance = CURRENT_POINT.squaredDistance(point);
          if (currentDistance < squaredRadius) {
            distanceOk = false;
          }
        }
        if (!distanceOk) {
          continue;
        }
        let squaredDistance = Infinity;
        for (const point of points) {
          const currentSquaredDistance = CURRENT_POINT.squaredDistance(point);
          if (currentSquaredDistance < squaredDistance) {
            squaredDistance = currentSquaredDistance;
            BEST_POINT.copy(CURRENT_POINT);
          }
        }
      }
      if (distanceOk) {
        const point = new Vector3(BEST_POINT);
        this.points.add(point);
        if (this.points.size === maxPoints) {
          break;
        }

        const column = Math.floor(point.x / this._radius);
        const row = Math.floor(point.y / this._radius);
        if (!grid[column]) {
          grid[column] = [];
        }
        if (!grid[column][row]) {
          grid[column][row] = [];
        }
        grid[column][row].push(point);

        step = 0;
      }
      step++;
    }
  }
}