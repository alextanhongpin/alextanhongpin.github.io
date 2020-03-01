

<script>
// Utils
import type from '../../utils/type'
import pause from '../../utils/pause'
import { state, actions } from '../../store/typewriter'

const { heading, subheading, headingGhost, subheadingGhost } = state
if (!heading.length && !subheading.length) {
	startTyping(
		actions,
		headingGhost.split(''),
		subheadingGhost.split('')
	)
}

// This functionality will be invoked only once
async function startTyping (actions, heading, subheading) {
  await type(heading.length, 0, counter => actions.updateHeading(heading[counter]))
  await pause(250)
  await type(subheading.length, 0, counter => actions.updateSubheading(subheading[counter]))
}

</script>

  <div class='body'>
    <div class='body-column'>
      <h1>
        {$heading}
	{#if heading.length !== headingGhost.length}
		<span class='caret' /> 
	{/if}
      </h1>
      <h1>
        {$subheading}
	{#if subheading.length !== subheadingGhost.length}
		<span class='caret is-active' />
	{/if}
      </h1>
    </div>
  </div>
