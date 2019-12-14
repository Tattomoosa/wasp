describe('graph', () => {
  let { Graph } = wasp
  let audioContext = new (window.AudioContext || window.webkitAudioContext)()

  // these nodes require their own tests
  let uniqueNodeTypes = [
    // Not intended to be created directly
    'AudioDestination',
    // Requires default config
    'IIRFilter'
  ]

  let genericNodeTypes = 
    Object.keys(Graph)
    .map(k => k.replace('Node',''))
  // # Exclude
  // .filter(k => k !== 'AudioDestination')
  // .filter(k => k !== 'IIRFilter')
    .filter(k => !uniqueNodeTypes.includes(k))

  // Describing methods
  describe('Creating WAAPI Nodes', () => {
    // # tests all `create${Node}` functions
    genericNodeTypes.forEach(type => {
      context(`${type}`, () => {
        let graph
        let node
        let fn_name = `create${type}`
        let waapiName = `${type}Node`
        let waapiConstructor = window[waapiName]
        let config = audioContext[fn_name]
        beforeEach(() => { graph = new wasp.Graph(audioContext) })
        it(`Graph.create${type}() -> Graph.${type}Node`, () => {
          node = graph[fn_name]()
          expect(node).to.be.an.instanceof(Graph[waapiName])
          expect(node.node).to.be.an.instanceof(waapiConstructor)
        })
        it(`graph.create${type}(config) -> Graph.${waapiName}`, () => {
          node = graph[fn_name](config)
          expect(node).to.be.an.instanceof(Graph[`${waapiName}`])
          expect(node.node).to.be.an.instanceof(waapiConstructor)
        })
        it(`new Graph.${type}() -> Graph.${type}Node`, () => {
          node = new Graph[waapiName](graph)
          expect(node).to.be.an.instanceof(Graph[`${waapiName}`])
          expect(node.node).to.be.an.instanceof(waapiConstructor)
        })
        it('updates graph state', () => {
          [ new Graph[waapiName](graph),
            new Graph[waapiName](graph, config),
            graph[fn_name](config),
            graph[fn_name]()
          ].forEach((node) => {
            expect(graph.nodes).to.have.property(node.id)
            expect(graph.nodes[node.id]).to.equal(node)
          })
        })
      })
    })
    context(`IIRFilter`, () => {
      let graph
      // this has to be a lambda, must be some garbage collecting issue (?)
      // it was causing problems only inside the test, when the WAAPI node
      // was created.
      let config = () => ({
        feedback: [0.2, 0.3, 0.4],
        feedforward: [0.2, 0.3, 0.4]
      })
      beforeEach(() => { graph = new wasp.Graph(audioContext) })
      it(`graph.createIIRFilter(config) -> Graph.IIRFilterNode`, () => {
        let node = new Graph.IIRFilterNode(graph, config())
        expect(node).to.be.an.instanceof(Graph['IIRFilterNode'])
        expect(node.node).to.be.an.instanceof(IIRFilterNode)
      })
      it(`new Graph.IIRFilterNode(config) -> Graph.IIRFilterNode`, () => {
        let node = new Graph.IIRFilterNode(graph, config())
        expect(node).to.be.an.instanceof(Graph['IIRFilterNode'])
        expect(node.node).to.be.an.instanceof(IIRFilterNode)
      })
      it('updates graph state', () => {
        [ new Graph.IIRFilterNode(graph, config()),
          graph.IIRFilterNode(config()),
        ].forEach((node) => {
          expect(graph.nodes).to.have.property(node.id)
          expect(graph.nodes[node.id]).to.equal(node)
        })
      })
    })
    context('Destination', () => {
      let graph
      beforeEach(() => { graph = new wasp.Graph(audioContext) })
      it('created in Graph constructor', () => {
        expect(graph).to.have.property('destination')
        expect(graph.destination.node).to.equal(audioContext.destination)
      })
    })
  });
  describe('Connecting Nodes', () => {
    let graph
    beforeEach(() => { graph = new wasp.Graph(audioContext) })
    it('single connection by ID', () => {
      let sender = graph.createOscillator()
      let receiver = graph.createGain()
      sender.connect(receiver)
      expect(sender.connections.sends).to.have.property(receiver.id)
      expect(sender.connections.sends[receiver.id].node).to.equal(receiver)
      expect(receiver.connections.receives).to.have.property(sender.id)
      expect(receiver.connections.receives[sender.id]).to.equal(sender)
    })
    it('single connection by id to parameter', () => {
      let sender = graph.createOscillator()
      let receiver = graph.createGain()
      sender.connect(receiver.gain)
      expect(sender.connections.sends).to.have.property(receiver.id)
      expect(sender.connections.sends[receiver.id].gain).to.equal(receiver.gain)
      expect(receiver.connections.receives.gain).to.have.property(sender.id)
      expect(receiver.connections.receives.gain[sender.id]).to.equal(sender)
    })
    it('single connection by id to ')
  })
})
