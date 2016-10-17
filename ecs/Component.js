import Signal from "../utils/Signal.js";

export default class Component {
  constructor(entity, {require = []} = {}) {
    this.entity = entity;

    this.active = true;

    this.onAdd = new Signal();
    this.onRemove = new Signal();

    for (let required of require) {
      if(!this.entity.hasComponent(required)) {
        console.error(this.entity + " needs component " + required);
      }
    }
  }
}
