import { h } from 'hyperapp'
import './index.css'

// Utils
import type from '../../../utils/type'
import pause from '../../../utils/pause'

const page = (state, actions) => props => {
  if (!state.heading.length && !state.subheading.length) {
    startTyping(
      actions,
      state.headingGhost.split(''),
      state.subheadingGhost.split('')
    )
  }

  return <div class='body'>
    <div class='body-column'>
      <h1>
        {state.heading}
        {state.heading.length !== state.headingGhost.length && <span class='caret' /> }
      </h1>
      <h1>
        {state.subheading}
        {state.subheading.length !== 0 && <span class='caret is-active' />}
      </h1>
    </div>
  </div>
}

// This functionality will be invoked only once
async function startTyping (actions, heading, subheading) {
  await type(heading.length, 0, counter => actions.updateHeading(heading[counter]))
  await pause(250)
  await type(subheading.length, 0, counter => actions.updateSubheading(subheading[counter]))
}

export default page
