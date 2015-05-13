import Boid from "./Boid";
import Vector2 from "../math/Vector2";
import SubstratePolygon from "./SubstratePolygon";
import SubstrateEdge from "./SubstrateEdge";

export default class SubstrateSystem {
  constructor(width, height, {speed = 1, spawnProbabilityRatio = 0.1, spawnOptions = {}}) {

    this.edges = [];
    this.polygons = [];

    this.speed = speed;
    this.spawnProbabilityRatio = spawnProbabilityRatio;
    this.spawnOptions = spawnOptions;

    this.width = width;
    this.height = height;

    this.data = new Uint32Array(this.width * this.height);
  }

  addBoid (x, y, velocityAngle, offsetAngle, life) {
    let boid = new Boid(x, y, velocityAngle, offsetAngle, life);
    let edge = new SubstrateEdge(new Vector2(boid.x, boid.y), new Vector2(boid.x, boid.y), boid);
    edge.id = this.edges.length ? this.edges[this.edges.length - 1].id + 1 : 1;
    this.edges.push(edge);
    return edge;
  }

  addPolygon (vertices) {
    let polygon = new SubstratePolygon(vertices);
    polygon.id = this.polygons.length ? this.polygons[this.polygons.length - 1].id + 1 : 0;
    this.polygons.push(polygon);
    this.polygonAddedCallback(polygon);
    return polygon;
  }

  polygonAddedCallback (polygon) {}

  update () {
    for (let i = 0; i < this.speed; i++) {
      for (let i = 0; i < this.edges.length; i++) {
        let edge = this.edges[i];
        if (edge.boid.isDead) {
          continue;
        }

        edge.update();

        if (edge.boid.x < 0 || edge.boid.x > this.width || edge.boid.y < 0 || edge.boid.y > this.height) {
          edge.boid.kill();
          continue;
        }

        let position = Math.round(edge.b.x) + this.width * Math.round(edge.b.y);

        let pixelId = this.data[position];
        let edgeId = i + 1;

        if (pixelId && pixelId !== edgeId) {
          edge.boid.kill();
          this.splitEdge(edge, pixelId);
        }
        else {
          // for (let i = -2; i < 3; i++) {
            // let position = Math.round(edge.boid.x + edge.boid.velocity.y * i * .33) + this.width * Math.round(edge.boid.y + -edge.boid.velocity.x * i * .33);
            // this.data[position] = edgeId;
          // }
          this.data[position] = edgeId;
        }

        // Add new edge
        if(Math.random() < this.spawnProbabilityRatio) {
          let velocityAngle;
          if(this.spawnOptions.velocityAngle === undefined) {
            velocityAngle = Math.pow(Math.random(), 100) * (Math.random() > 0.5 ? 1 : -1) + edge.boid.velocityAngle + Math.PI * 0.5 * (Math.random() > 0.5 ? 1 : -1);
          }
          else {
            velocityAngle = edge.boid.velocityAngle + this.spawnOptions.velocityAngle;
          }
          let newEdge = this.addBoid(edge.b.x, edge.b.y, velocityAngle, 0, edge.boid.life);
          this.splitEdge(newEdge, edgeId, true);
        }
      }
    }
  }

  splitEdge (edge, edgeId) {
    let oldEdge = this.edges[edgeId - 1];

    let angle = oldEdge.boid.velocity.angleTo(edge.boid.velocity);

    let isMainEdge = angle > 0;

    let sweepBoid = new Boid(edge.b.x, edge.b.y, oldEdge.boid.velocityAngle, oldEdge.boid.offsetAngle);
    sweepBoid.update();

    let newEdge = this.addBoid(oldEdge.boid.x, oldEdge.boid.y, oldEdge.boid.velocityAngle, oldEdge.boid.offsetAngle, oldEdge.boid.life);

    if (oldEdge.boid.isDead) {
      newEdge.boid.kill();
    }
    else {
      oldEdge.boid.kill();
    }
    newEdge.a.copy(sweepBoid);
    oldEdge.b.copy(edge.b);

    // Detect if spawned or collided
    let collided = edge.boid.isDead;

    if(collided) {
      isMainEdge = !isMainEdge;
    }

    if (oldEdge.next !== oldEdge.twin) {
      newEdge.next = oldEdge.next;
      newEdge.next.twin.next.twin.next = newEdge.twin;
    }

    if (isMainEdge) {
      newEdge.twin.next = oldEdge.twin;
      if (collided) {
        // console.log("main collided - " + edge.id + ' with ' + oldEdge.id);
        edge.next = newEdge;
        oldEdge.next = edge.twin;
      }
      else {
        // console.log("main spawned - " + edge.id + ' with ' + oldEdge.id);
        edge.twin.next = newEdge;
        oldEdge.next = edge;
      }
    }
    else {
      oldEdge.next = newEdge;
      if (collided) {
        // console.log("twin collided - " + edge.id + ' with ' + oldEdge.id);
        edge.next = oldEdge.twin;
        newEdge.twin.next = edge.twin;
      }
      else {
        // console.log("twin spawned - " + edge.id + ' with ' + oldEdge.id);
        newEdge.twin.next = edge;
        edge.twin.next = oldEdge.twin;
      }
    }

    let sweepSecurityMargin = 0;
    while (sweepSecurityMargin < 100) {
      for (let i = -4; i < 5; i++) {
        let sweepPosition = Math.round(sweepBoid.x + sweepBoid.velocity.y * i * .33) + this.width * Math.round(sweepBoid.y - sweepBoid.velocity.x * i * .33);
        if(this.data[sweepPosition] === oldEdge.id) {
          this.data[sweepPosition] = newEdge.id;
          sweepSecurityMargin = 0;
        }
      }
      sweepBoid.update();
      sweepSecurityMargin++;
    }

    if(collided) {
      this.polygonCheck(edge);
      this.polygonCheck(edge.twin);
    }
  }

  polygonCheck (startEdge) {
    let edge = startEdge;
    let vertices = [new Vector2(edge.a.x, edge.a.y)];
    for (let i = 0; i < 100; i++) {
      if (edge.next === edge.twin) {
        break;
      }
      // if (Math.abs(edge.angle - edge.next.angle) > .01) {
      //   vertices.push(new Vector2(edge.b.x, edge.b.y));
      // }
      // else {
      //   console.log(edge.angle - edge.next.angle);
      // }
      vertices.push(new Vector2(edge.b.x, edge.b.y));
      edge = edge.next;
      if (edge === startEdge) {
        this.addPolygon(vertices);
        break;
      }
    }
  }
}
