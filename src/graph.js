/*
 * Wasp Graph
 *
 * This module is wrapped directly around the Web Audio API and presents an
 * identical API, while tracking all created nodes/connections.
 *
 * It is the lowest level WASP module, and can be used on its own without
 * any other WASP features.
 */

// TODO Instead of current architecture, could modify
// AudioNodePrototype directly... is that a bad idea?

'use strict'

// todo fat arrow generator?
let idGen = (function* () {
    let id = 0
    for (;;) yield id++
})()

function isAudioParam(param) {
    return param.constructor.name === 'AudioParam'
}

class GraphNode {
    constructor(id) {
        this.id = id
        this.connections = {sends: {}, receives: {}}
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

class AudioGraphParam {
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

class AudioGraphNode extends GraphNode {
    constructor(id, audioNode, context) {
        super(id)
        this.connectionType = 'node'
        // if node is constructor (TODO better way?)
        if (typeof audioNode === 'function')
            this.node = new audioNode(context)
        // if node is pre-existing WAAPI node
        else this.node = audioNode
        this.connector = this.node
        for (let prop in this.node) {
            if (!(prop in this)) {
                // if AudioParam, wrap it up
                if (this.node[prop] && isAudioParam(this.node[prop])) {
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
        GraphNode.prototype.disconnect.call(this)
    }
}

const audioNodes = [
    OscillatorNode,
    PannerNode,
    AnalyserNode,
    BiquadFilterNode,
    GainNode,
    DelayNode,
    StereoPannerNode,
    ConvolverNode,
]

export default class Graph {
    constructor(context) {
        this.nodes = {}
        // shortcut methods
        audioNodes.forEach(
            node => this['create' + node.name.replace('Node','')] = () => {
                return this.createNode(node, context)
            })
    }

    createNode(nodeType, context) {
        return this.addAudioNode(new nodeType(context))
    }

    addAudioNode(node) {
        let id = idGen.next().value
        return this.nodes[id] = new AudioGraphNode(id, node)
    }
}
