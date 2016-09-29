let entitiesSet = new Set();
let componentEntities = new Map();

export default class Entity {
  static getEntities(ComponentClass) {
    if (!ComponentClass) {
      return entitiesSet;
    }
    let entities = componentEntities.get(ComponentClass);
    if (!entities) {
      entities = new Set();
      componentEntities.set(ComponentClass, entities);
    }
    return entities;
  }

  constructor({name = ""} = {}) {
    this._name = name;

    this._components = new Map();
    this._componentsSaved = new Map();

    this.active = true;

    entitiesSet.add(this);
  }

  get name() {
    return this._name;
  }

  getComponent(ComponentClass) {
    return this._components.get(ComponentClass);
  }

  hasComponent(ComponentClass) {
    return this._components.has(ComponentClass);
  }

  addComponent(ComponentClass, ...args) {
    let component = this._componentsSaved.get(ComponentClass) || this.getComponent(ComponentClass);
    if (component && !args.length) {
      this._componentsSaved.delete(ComponentClass);
    } else {
      component = new ComponentClass(this, ...args);
    }
    this._components.set(ComponentClass, component);
    let entities = Entity.getEntities(ComponentClass);
    entities.add(this);
    component.onAdd.dispatch();
    return component;
  }

  removeComponent(ComponentClass) {
    let component = this.getComponent(ComponentClass);
    if (!component) {
      return;
    }
    this._componentsSaved.set(ComponentClass, component);
    this._components.delete(ComponentClass);
    Entity.getEntities(ComponentClass).delete(this);
    component.onRemove.dispatch();
    return component;
  }

  toggleComponent(ComponentClass, force, ...args) {
    if (force || force === undefined && !this.getComponent(ComponentClass)) {
      this.addComponent(ComponentClass, ...args)
    } else {
      this.removeComponent(ComponentClass)
    }
  }
}
