let knobStyle = `
  .knob-control__knob {
    background: #333;
    border-radius: 50%;
    width: 50px;
    height: 50px;
  }
`

class Knob extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({mode: `open`})
    this.shadowRoot.innerHTML = `
      <style>
      ${knobStyle}
      </style>
      <div class=".knob-control__knob">
      </div>
    `
  }
  connectedCallback() {}
  attributeChangeCallback() {}
  disconnectedCallback() {}
}
customElements.define('ui-knob', Knob)
