import { h } from 'hyperapp'
import './index.css'

const page = (state, actions) => props => (
  <div class='body'>
    <div class='body-column'>
      <h1>
        {state.heading}
        {state.heading.length !== state.headingGhost.length && <span class='caret' /> }
      </h1>
      <h1>
        {state.subheading}
        {state.subheading.length !== 0 && <span class='caret' />}
      </h1>
    </div>
  </div>
)

export default page
