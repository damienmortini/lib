export default class Component {
  constructor(entity, {require = []} = {}) {
    this.entity = entity;

    for (let required of require) {
      if(!this.entity.hasComponent(required)) {
        console.error(this.entity + " needs component " + required);
      }
    }
  }
}
