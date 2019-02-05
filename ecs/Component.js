import Signal from "../util/Signal.js";

const STATIC_ON_ADD_MAP = new Map();
const STATIC_ON_REMOVE_MAP = new Map();

export default class Component {
  static get onAdd() {
    let signal = STATIC_ON_ADD_MAP.get(this);
    if(!signal) {
      signal = new Signal();
      STATIC_ON_ADD_MAP.set(this, signal);
    }
    return signal;
  }
  
  static get onRemove() {
    let signal = STATIC_ON_REMOVE_MAP.get(this);
    if(!signal) {
      signal = new Signal();
      STATIC_ON_REMOVE_MAP.set(this, signal);
    }
    return signal;
  }

  constructor(entity, {require = []} = {}) {
    this.entity = entity;

    this.active = true;

    this.onAdd = new Signal();
    this.onRemove = new Signal();

    for (let component of require) {
      if(!this.entity.hasComponent(component)) {
        console.error(this.entity + " needs component " + component);
      }
    }
  }
}
