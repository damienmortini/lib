import Vector3 from "./Vector3.js";

const CURRENT_POINT = new Vector3();
const BEST_POINT = new Vector3();

export default class PoissonDiskSampler {
  static fill({
    x = 0,
    y = 0,
    z = 0,
    width,
    height,
    depth = 0,
    radius,
    steps = 100,
    points = []
  }) {
    const newPoints = [];

    const squaredRadius = radius * radius;

    const grid = [];
    for (const point of points) {
      const gridX = Math.floor((point.x - x) / radius);
      const gridY = Math.floor((point.y - y) / radius);
      const gridZ = Math.floor((point.z - z) / radius);
      if (!grid[gridZ]) {
        grid[gridZ] = [];
      }
      if (!grid[gridZ][gridY]) {
        grid[gridZ][gridY] = [];
      }
      if (!grid[gridZ][gridY][gridX]) {
        grid[gridZ][gridY][gridX] = [];
      }
      grid[gridZ][gridY][gridX].push(point);
    }

    let step = 0;
    while (step < steps) {
      let distanceOk = true;
      for (let index = 0; index < 10; index++) {
        CURRENT_POINT.set(
          x + Math.random() * width,
          y + Math.random() * height,
          z + Math.random() * depth,
        );
        BEST_POINT.copy(CURRENT_POINT);

        const gridX = Math.floor((CURRENT_POINT.x - x) / radius);
        const gridY = Math.floor((CURRENT_POINT.y - y) / radius);
        const gridZ = Math.floor((CURRENT_POINT.z - z) / radius);
        const points = [];
        
        const hasDepth = depth ? 1 : 0;
        for (let gridZOffset = -hasDepth; gridZOffset < 1 + hasDepth; gridZOffset++) {
          for (let gridYOffset = -1; gridYOffset < 2; gridYOffset++) {
            for (let gridXOffset = -1; gridXOffset < 2; gridXOffset++) {
              const currentGridX = gridX + gridXOffset;
              const currentGridY = gridY + gridYOffset;
              const currentGridZ = gridZ + gridZOffset;
              if (grid[currentGridZ] && grid[currentGridZ][currentGridY] && grid[currentGridZ][currentGridY][currentGridX]) {
                points.push(...grid[currentGridZ][currentGridY][currentGridX]);
              }
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
        newPoints.push(point);

        const gridX = Math.floor((point.x - x) / radius);
        const gridY = Math.floor((point.y - y) / radius);
        const gridZ = Math.floor((point.z - z) / radius);
        if (!grid[gridZ]) {
          grid[gridZ] = [];
        }
        if (!grid[gridZ][gridY]) {
          grid[gridZ][gridY] = [];
        }
        if (!grid[gridZ][gridY][gridX]) {
          grid[gridZ][gridY][gridX] = [];
        }
        grid[gridZ][gridY][gridX].push(point);

        step = 0;
      }
      step++;
    }

    return newPoints;
  }
}