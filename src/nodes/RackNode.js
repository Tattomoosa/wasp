import Graph, { GraphNode } from '../graph'

let defaultConfig = {
  inputs: {
    'in': null,
  },
  outputs: {
    'out': null,
  },
}

export default {
  apply() {
    Graph.RackNode = class extends Graph.GraphNode {
      constructor(graph, config) {
        super(graph.createNodeID(), graph)
      }
    }
    Graph.createRackNode = (config) => {
      return new Graph.RackNode(config)
    }
  }
}
