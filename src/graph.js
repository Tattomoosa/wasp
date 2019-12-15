/*
 * Wasp Graph
 *
 * This module is wrapped directly around the Web Audio API and intends to
 * present a nearly identical API, while tracking all created nodes/connections.
 *
 * It is the lowest level WASP module, and can be used on its own without
 * the rest of wasp.
 */

const DEFAULT_CONTEXT = new window.AudioContext || window.webkitAudioContext

function isAudioParam(param) {
  return param != null && param.constructor.name === 'AudioParam'
}

export class GraphNode {
  constructor(graph) {
    if (graph === undefined)
      console.error('GraphNode', graph, id)
    this.id = graph.createNodeID()
    this.graph = graph
    this.connections = {sends: {}, receives: {}}
    graph.__addGraphNode(this)
  }

  connect(destination) {
    let {sends} = this.connections
    sends[destination.id] = sends[destination.id] || {}
    sends[destination.id][destination.connectionType] = destination
    destination.onConnect(this)
  }

  onConnect(sender) {
    this.connections.receives[sender.id] = sender
  }

  onDisconnect(sender) {
    delete this.connections.receives[sender.id]
  }

  disconnect(destination) {
    let {sends} = this.connections
    // update this sends
    delete sends[destination.id][destination.connectionType]
    if (Object.entries(sends[destination.id]).length === 0)
      delete sends[destination.id]
    // update destination receives
    destination.onDisconnect(this)
  }
}

export class AudioGraphParam {
  constructor(id, connectionType, audioParam, receives) {
    this.id = id
    this.connectionType = connectionType
    this.param = audioParam
    this.receives = receives
    this.connector = this.param
    for (let prop in this.param) {
      Object.defineProperty(this, prop, {
        get: () => this.param[prop],
        set: (value) => this.param[prop] = value
      })
    }
  }

  onConnect(sender) {
    this.receives[sender.id] = sender
  }

  onDisconnect(sender) {
    delete this.receives[sender.id]
  }
}

export class AudioGraphNode extends GraphNode {
  constructor(audioNode, graph) {
    if (graph === undefined)
      console.error('AudioGraphNode', graph)
    super(graph)
    this.connectionType = 'node'
    this.node = audioNode
    this.connector = this.node
    for (let prop in this.node) {
      if (!(prop in this)) {
        // if AudioParam, wrap it up
        if (isAudioParam(this.node[prop])) {
          // this.connections.receives[prop] = {}
          this[prop] = new AudioGraphParam(
            this.id,
            prop,
            this.node[prop],
            this.connections.receives[prop] = {},
          )
        }
        else
          this[prop] = () => { this.node[prop] }
      }
    }
  }

  connect(destination) {
    this.node.connect(destination.connector)
    GraphNode.prototype.connect.call(this, destination)
  }

  disconnect(destination) {
    this.node.disconnect(destination.connector)
    GraphNode.prototype.disconnect.call(this, destination)
  }
}

// Gets a (nearly) complete list of all Nodes a Web Audio API context can
// create.
const audioNodes = Object.getOwnPropertyNames(
  Object.getPrototypeOf(AudioContext.prototype))
  .filter(x => x.includes('create'))
  .map(x => `${x.replace('create', '')}Node`)
  .map(x => window[x])
  .filter(x => x !== undefined)
  .filter(x => x !== ScriptProcessorNode)


class Graph {
  constructor(context = DEFAULT_CONTEXT) {
    this.nodes = {}
    {
      let id = 0 // private
      // always returns a unique id (to this graph, ever-increasing)
      this.createNodeID = () => id++
    }
    // shortcut methods
    audioNodes.forEach(node => {
      let createFn = `create${node.name.replace('Node', '')}`
      this[node.name] = this[createFn] = (config) =>
        this.createNode(node, config)
    })
    this.__context = context
    this.destination = new Graph.AudioDestinationNode(this, context.destination)
  }

  createNode(nodeType, config) {
    /*
    let node = new Graph[nodeType.name](this, config)
    return this.nodes[node.id] = node
    */
    return new Graph[nodeType.name](this, config)
  }

  __addGraphNode(node) {
    if (this.nodes[node.id] !== undefined)
      throw(new Error('Graph already contains node id'))
    return this.nodes[node.id] = node
  }
}
audioNodes.forEach(
  waapiNode => Graph[waapiNode.name] = class extends AudioGraphNode {
    constructor(graph, config) {
      if (!graph instanceof Graph)
        throw(new TypeError('graph must be an instance of Graph'))
      super(new waapiNode(graph.__context, config), graph)
    }
  })

Graph.AudioDestinationNode = class extends AudioGraphNode {
  constructor(graph, node) {
    if (!graph instanceof Graph)
      throw(new TypeError('graph must be an instance of Graph'))
    super(node, graph)
  }
}

export default Graph
