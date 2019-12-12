'use strict'

let idGen = (function* () {
    let id = 0
    while (true)
        yield id++
})()

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
                if (this.node[prop] && this.node[prop].constructor.name === 'AudioParam') {
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

class AudioGraph {
    constructor() {
        this.nodes = {}
    }

    createNode(nodeType, context) {
        return this.addAudioNode(new nodeType(context))
    }

    addAudioNode = (node) => {
        let id = idGen.next().value
        return this.nodes[id] = new AudioGraph(id, node)
    }
}

let graph = new AudioGraph()

audioNodes.forEach(node => graph['create' + node.name] = (context) => {
    return graph.createNode(node, context)
})

const context = new (window.AudioContext || window.webkitAudioContext)()

// wrap
let dest = graph.addAudioNode(context.destination)
let osc = graph.createOscillatorNode(context)
let lfo = graph.createOscillatorNode(context)
let gain = graph.createGainNode(context)
osc.connect(gain)
gain.gain.value = 0.2
console.log(osc.frequency.value, osc.node.frequency)
osc.frequency.value = 200
lfo.frequency.value = 4
// lfo.frequency.value = 4
console.log(gain.gain)
lfo.connect(gain.gain)
gain.connect(dest)
lfo.node.start()
osc.node.start()
console.log(osc, lfo)