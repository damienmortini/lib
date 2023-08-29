# property-graph

[![Latest NPM release](https://img.shields.io/npm/v/property-graph.svg)](https://www.npmjs.com/package/property-graph)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/property-graph)](https://bundlephobia.com/package/property-graph)
[![License](https://img.shields.io/badge/license-MIT-007ec6.svg)](https://github.com/donmccurdy/property-graph/blob/main/LICENSE)
[![Build Status](https://github.com/donmccurdy/property-graph/workflows/build/badge.svg?branch=main&event=push)](https://github.com/donmccurdy/property-graph/actions?query=workflow%3Abuild)
[![Coverage](https://codecov.io/gh/donmccurdy/property-graph/branch/main/graph/badge.svg?token=S30LCC3L04)](https://codecov.io/gh/donmccurdy/property-graph)

Extensible base for creating objects that behave like a Property Graph.

## Overview

The `property-graph` package is intended as a foundation for libraries requiring many custom types of compatible parts, which can be represented as a [Property Graph](https://www.dataversity.net/what-is-a-property-graph/#). The Property Graph representation is useful for dependency chains, resource references, node-based art workflows, and a broader class of applications where Graph databases are common.

Conceptually, a Property Graph is a [labeled, directed multigraph](https://en.wikipedia.org/wiki/Multigraph#Labeling), in which entities ("nodes") may have named relationships ("edges") with other nodes on the graph. Both nodes and edges may also be associated with key/value attributes. Beyond that, `property-graph` is intended to be small and practical, rather than providing a large standard library for graph theory — if you need something more comprehensive, I'd suggest [`graphology`](https://graphology.github.io/).

Typically, you'll define several classes inheriting from the base `GraphNode`. When using TypeScript, an interface should be provided defining the kinds of connections that each type of graph node allows. Then, `.set` and `.get` methods may be used to set key/value attributes (strings, numbers, booleans, ...), and `.getRef` and `.setRef` methods may be used to create edges (or relationships) to other nodes of a compatible type. All references have names, and support compile-time type-checking.

## Features

In a codebase with many distinct types of entities and relationships among them (e.g. "Client has N Projects", "Project has N Tasks"), this project can make management of entities and their relationships considerably easier than writing plain getters/setters for each case.

- **Traversal:** GraphEdges are tracked and can be traversed up or down
- **Disposal:** GraphNode disposal automatically cleans up incoming references from other nodes
- **Finding dependents:** Efficiently locate all GraphNodes that refer _to_ a given GraphNode, or that have references _from_ a given GraphNode
- **Change detection:** GraphNodes dispatch events when changed, which can be optionally propagated throughout the graph
- **Extensibility:** Operations like `.copy()`, `.equals()`, and `.swap(a, b)` can be implemented abstractly

## Usage

**Definitions:**

```typescript
interface IPerson {
  name: string;
  age: number;
  friends: Person[];
  pet: Pet;
}

interface IPet {
  type: 'dog' | 'cat';
  name: string;
}

class Person extends GraphNode<IPerson> {
	getDefaults(): Nullable<IPerson> {
		return {name: '', age: 0, friends: [], pet: null};
	}
}
class Pet extends GraphNode<IPet> {
	getDefaults(): Nullable<IPet> {
		return {type: 'dog', name: ''};
	}
}
```

**Basic usage:**

```typescript
const graph = new Graph();

const spot = new Pet(graph)
  .set('type', 'dog')
  .set('name', 'Spot');

const jo = new Person(graph)
  .set('name', 'Jo')
  .set('age', 41)
  .setRef('pet', spot);

const sam = new Person(graph)
  .set('name', 'Sam')
  .set('age', 45)
  .addRef('friends', jo);
```

**Lifecycles:**

```typescript
jo.equals(sam); // recursive equality → false

console.log(sam.listRefs('friends')); // → [jo]

jo.dispose();

console.log(sam.listRefs('friends')); // → []
```

## API

### Literal Attributes

Literal attributes (string, number, boolean, ...) are modified with two methods:

- `node.get('key'): Literal`
- `node.set('key', value: Literal): this`

### References


References support one named connection to a single graph node of a given type:

- `node.getRef('key'): GraphNode`
- `node.setRef('key', node: GraphNode): this`

### Reference Lists

Reference Lists support a named list of connections to graph nodes of a given type:

- `node.addRef('key', node: GraphNode): this`
- `node.removeRef('key', node: GraphNode): this`
- `node.listRefs('key'): GraphNode[]`

### Reference Maps

Reference Maps support a named map having any number of subkeys, where each subkey points to a graph node of a given type:

- `node.getRefMap('key', 'subkey'): GraphNode`
- `node.setRefMap('key', 'subkey', node: GraphNode): this`
- `node.listRefMapKeys('key'): string[]`
- `node.listRefMapValues('key'): GraphNode[]`

## References

- [The Property Graph Database Model](http://ceur-ws.org/Vol-2100/paper26.pdf)
- [Graph Fundamentals — Part 2: Labelled Property Graphs](https://medium.com/terminusdb/graph-fundamentals-part-2-labelled-property-graphs-ba9a8edb5dfe)
- [OpenCypher – Property Graph Model](https://github.com/opencypher/openCypher/blob/master/docs/property-graph-model.adoc)
