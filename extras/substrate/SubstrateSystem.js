import Particle from "../../physics/Particle.js";
import Vector2 from "../../math/Vector2.js";
import SubstratePolygon from "./SubstratePolygon.js";
import SubstrateEdge from "./SubstrateEdge.js";

export default class SubstrateSystem {
  constructor(width, height, {speed = 1, maxEdges = Infinity, spawnProbabilityRatio = 0.1, spawnOptions = {}}) {

    this.edges = [];
    this.edgesPool = [];
    this.polygons = [];

    this.speed = speed;
    this.spawnProbabilityRatio = spawnProbabilityRatio;
    this.maxEdges = maxEdges;
    this.spawnOptions = spawnOptions;

    this._sweepBoid = new Particle();

    if (this.maxEdges < Infinity) {
      for (let i = 0; i < this.maxEdges; i++) {
        this.edgesPool.push(new SubstrateEdge(new Vector2(), new Particle()));
      }
    }

    this.width = width;
    this.height = height;

    this.data = new Uint32Array(this.width * this.height);
  }

  clear() {
    for (let i = 0; i < this.data.length; i++) {
      this.data[i] = 0;
    }
    while (this.edges.length) {
      let edge = this.edges.pop();
      edge.reset();
      this.edgesPool.push(edge);
    }
    this.polygons.length = 0;
  }

  spawnEdge(x, y, velocityAngle, life) {
    let edge = this.edgesPool.pop();
    if (!edge) {
      edge = new SubstrateEdge(new Vector2(), new Particle())
    }
    edge.a.set(x, y);
    edge.boid.reset(x, y, life);
    edge.boid.velocity.setFromAngle(velocityAngle);
    this.edges.push(edge);
    edge.id = this.edges.length;
    return edge;
  }

  addPolygon(vertices) {
    let polygon = new SubstratePolygon(vertices);
    polygon.id = this.polygons.length ? this.polygons[this.polygons.length - 1].id + 1 : 0;
    this.polygons.push(polygon);
    this.polygonAddedCallback(polygon);
    return polygon;
  }

  polygonAddedCallback(polygon) {}

  update() {
    for (let i = 0; i < this.speed; i++) {
      for (let i = 0; i < this.edges.length; i++) {
        let edge = this.edges[i];
        if (edge.boid.isDead) {
          continue;
        }

        edge.boid.update();

        if (edge.boid.position.x <= 0 || edge.boid.position.x >= this.width || edge.boid.position.y <= 0 || edge.boid.position.y >= this.height) {
          edge.boid.kill();
          continue;
        }

        let position = Math.floor(edge.boid.position.x) + this.width * Math.floor(edge.boid.position.y);

        let pixelId = this.data[position];

        if (pixelId && pixelId !== edge.id) {
          edge.boid.kill();
          this.splitEdgeWithEdge(this.getEdgeById(pixelId), edge);
        } else {
          // for (let i = -2; i < 3; i++) {
          // let position = Math.floor(edge.boid.position.x + edge.boid.velocity.y * i * .33) + this.width * Math.floor(edge.boid.position.y + -edge.boid.velocity.x * i * .33);
          // this.data[position] = edge.id;
          // }
          this.data[position] = edge.id;
        }

        // Add new edge
        if (this.edges.length < this.maxEdges && Math.random() < this.spawnProbabilityRatio) {
          let velocityAngle;
          if (this.spawnOptions.velocityAngle === undefined) {
            velocityAngle = Math.pow(Math.random(), 100) * (Math.random() > 0.5 ? 1 : -1) + edge.boid.velocity.angle + Math.PI * 0.5 * (Math.random() > 0.5 ? 1 : -1);
          } else {
            velocityAngle = edge.boid.velocity.angle + this.spawnOptions.velocityAngle;
          }
          let spawnEdge = this.spawnEdge(edge.boid.position.x, edge.boid.position.y, velocityAngle, edge.boid.life);
          this.splitEdgeWithEdge(edge, spawnEdge);
        }
      }
    }
  }

  getEdgeById(id) {
    return this.edges[id - 1];
  }

  splitEdgeWithEdge(splittedEdge, edge) {
    let angle = splittedEdge.boid.velocity.angleTo(edge.boid.velocity);
    let isMainEdge = angle > 0;

    this._sweepBoid.reset(edge.b.x, edge.b.y);
    this._sweepBoid.velocity.copy(splittedEdge.boid.velocity);
    this._sweepBoid.update();

    let newEdge = this.spawnEdge(this._sweepBoid.position.x, this._sweepBoid.position.y);
    newEdge.boid.copy(splittedEdge.boid);

    if (splittedEdge.boid.isDead) {
      newEdge.boid.kill();
    } else {
      splittedEdge.boid.kill();
    }

    splittedEdge.b.copy(edge.b);

    // Detect if spawned or collided
    let collided = edge.boid.isDead;

    if (collided) {
      isMainEdge = !isMainEdge;
    }

    if (splittedEdge.next !== splittedEdge.twin) {
      newEdge.next = splittedEdge.next;
      newEdge.next.twin.next.twin.next = newEdge.twin;
    }

    if (isMainEdge) {
      newEdge.twin.next = splittedEdge.twin;
      if (collided) {
        // console.log("main collided - " + edge.id + ' with ' + splittedEdge.id);
        edge.next = newEdge;
        splittedEdge.next = edge.twin;
      } else {
        // console.log("main spawned - " + edge.id + ' with ' + splittedEdge.id);
        edge.twin.next = newEdge;
        splittedEdge.next = edge;
      }
    } else {
      splittedEdge.next = newEdge;
      if (collided) {
        // console.log("twin collided - " + edge.id + ' with ' + splittedEdge.id);
        edge.next = splittedEdge.twin;
        newEdge.twin.next = edge.twin;
      } else {
        // console.log("twin spawned - " + edge.id + ' with ' + splittedEdge.id);
        newEdge.twin.next = edge;
        edge.twin.next = splittedEdge.twin;
      }
    }

    let sweepSecurityMargin = 0;
    while (sweepSecurityMargin < 3) {
      for (let i = -4; i < 5; i++) {
        let sweepPosition = Math.floor(this._sweepBoid.position.x + this._sweepBoid.velocity.y * i * .33) + this.width * Math.floor(this._sweepBoid.position.y - this._sweepBoid.velocity.x * i * .33);
        if (this.data[sweepPosition] === splittedEdge.id) {
          this.data[sweepPosition] = newEdge.id;
          sweepSecurityMargin = 0;
        }
      }
      this._sweepBoid.update();
      sweepSecurityMargin++;
    }

    if (collided) {
      this.polygonCheck(edge);
      this.polygonCheck(edge.twin);
    }
  }

  polygonCheck(startEdge) {
    let edge = startEdge;
    let edgesNumber = 0;

    for (let i = 0; i < 16; i++) {
      if (edge.next === edge.twin) {
        return;
      }
      edge = edge.next;
      if (edge === startEdge) {
        edgesNumber = i;
      }
    }

    if (!edgesNumber) {
      return;
    }

    let vertices = [new Vector2(edge.a.x, edge.a.y)];
    for (let i = 0; i < edgesNumber; i++) {
      if (Math.abs(edge.angle - edge.next.angle) > .1) {
        vertices.push(new Vector2(edge.b.x, edge.b.y));
      }
      edge = edge.next;
    }

    this.addPolygon(vertices);
  }
}
