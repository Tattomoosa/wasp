describe('graph', () => {
  let { Graph } = wasp
  let audioContext = new (window.AudioContext || window.webkitAudioContext)()

  // Describing methods
  describe('Creating Nodes', () => {
    // # tests all `create${Node}` functions
    Object.keys(Graph)
      .map(k => k.replace('Node',''))
      // # Exclude
      // Not intended to be created directly
      .filter(k => k !== 'AudioDestination')
      // Has some special considerations
      .filter(k => k !== 'IIRFilter')
      .forEach(type => {
        context(`${type}`, () => {
          let graph
          let node
          let fn_name = `create${type}`
          let waapiName = `${type}Node`
          let waapiConstructor = window[waapiName]
            graph = new wasp.Graph(audioContext)
          beforeEach(() => {
          })
          it(`Graph.create${type}() -> Graph.${type}Node`, () => {
            node = graph[fn_name]()
            expect(node).to.be.an.instanceof(Graph[waapiName])
            expect(node.node).to.be.an.instanceof(waapiConstructor)
          })
          it(`Graph.create${type}(config) -> Graph.${waapiName}`, () => {
            let fn = audioContext[fn_name]
            node = graph[fn_name](fn)
            expect(node).to.be.an.instanceof(Graph[`${waapiName}`])
            expect(node.node).to.be.an.instanceof(waapiConstructor)
          })
          it(`new Graph.${type}() -> Graph.${type}Node`, () => {
            console.log('test', graph)
            node = new Graph[waapiName](graph)
            // graph.addAudioNode(node)
            // expect(node).to.be.an.instanceof(Graph[waapiName])
            // expect(true).to.equal(false)
          })
          it(`Graph.create${type}() and update the graph accordingly`, () => {
            console.log('test', graph)
            node = new Graph[waapiName](graph)
            expect(graph.nodes).to.have.property(node.id)
            expect(graph.nodes[node.id]).to.equal(node)
          })
          it(`new Graph.${type}() and update the graph accordingly`, () => {
            console.log('test', graph)
            node = new Graph[waapiName](graph)
            expect(graph.nodes).to.have.property(node.id)
            expect(graph.nodes[node.id]).to.equal(node)
            // graph.addAudioNode(node)
          })
        })
      })
      context(`#createIIRFilter()`, () => {
        let graph
        let node
        // this has to be a lambda, must be some garbage collecting error (?)
        // it was causing problems only inside the test, when the WAAPI node
        // was created.
        let config = () => ({
          feedback: [0.2, 0.3, 0.4],
          feedforward: [0.2, 0.3, 0.4]
        })
        beforeEach(() => {
          graph = new wasp.Graph(audioContext)
        })
        it(`create a Graph.IIRFilterNode with a configuration`, () => {
          // node = audioContext.createIIRFilter(config.feedback, config.feedforward)
          node = new IIRFilterNode(audioContext, config())
        })
        it('update the graph', () => {
          node = graph.createIIRFilter(config())
          expect(graph.nodes).to.have.property(node.id)
          expect(graph.nodes[node.id]).to.equal(node)
        })
      })
  });
})
