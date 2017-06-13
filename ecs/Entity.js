let entitiesSet = new Set();
let entitiesSetActive = new Set();
let componentEntities = new Map();
let componentEntitiesActive = new Map();

export default class Entity {
  static getEntities(ComponentClass, {
    onlyActive = false
  } = {}) {
    if (!ComponentClass) {
      return onlyActive ? entitiesSetActive : entitiesSet;
    }
    let entities = (onlyActive ? componentEntitiesActive : componentEntities).get(ComponentClass);
    if (!entities) {
      entities = new Set();
      (onlyActive ? componentEntitiesActive : componentEntities).set(ComponentClass, entities);
    }
    return entities;
  }

  constructor({name = this.constructor.name} = {}) {
    this._name = name;

    this._components = new Map();

    this._active = true;

    entitiesSet.add(this);
  }

  get name() {
    return this._name;
  }

  set active(value) {
    this._active = value;
    for (let ComponentClass of this._components.keys()) {
      if(this._active) {
        Entity.getEntities(ComponentClass, {onlyActive : true}).add(this);
      } else {
        Entity.getEntities(ComponentClass, {onlyActive : true}).delete(this);
      }
    }
  }

  get active() {
    return this._active;
  }

  getComponent(ComponentClass) {
    return this._components.get(ComponentClass);
  }

  hasComponent(ComponentClass) {
    return this._components.has(ComponentClass);
  }

  addComponent(ComponentClass, ...args) {
    this.removeComponent(ComponentClass);
    let component = new ComponentClass(this, ...args);
    this._components.set(ComponentClass, component);
    Entity.getEntities(ComponentClass).add(this);
    if(this.active) {
      Entity.getEntities(ComponentClass, {onlyActive: true}).add(this);
    }
    ComponentClass.onAdd.dispatch({component});
    component.onAdd.dispatch({component});
    return component;
  }

  removeComponent(ComponentClass) {
    let component = this.getComponent(ComponentClass);
    if (!component) {
      return;
    }
    this._components.delete(ComponentClass);
    Entity.getEntities(ComponentClass).delete(this);
    Entity.getEntities(ComponentClass, {onlyActive: true}).delete(this);
    ComponentClass.onRemove.dispatch({component});
    component.onRemove.dispatch({component});
    return component;
  }

  toggleComponent(ComponentClass, force, ...args) {
    if (force || force === undefined && !this.getComponent(ComponentClass)) {
      this.addComponent(ComponentClass, ...args)
    } else {
      this.removeComponent(ComponentClass)
    }
  }

  destroy() {
    for (let ComponentClass of this._components.keys()) {
      this.removeComponent(ComponentClass);
    }
  }
}
