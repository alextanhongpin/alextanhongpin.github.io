<script>
  import { onMount } from 'svelte'

  // Utils
  import type from '../../utils/type'
  import pause from '../../utils/pause'
  import state from '../../store/typewriter'

  const { heading, subheading, headingGhost, subheadingGhost } = state

  onMount(() => {
    clear()
    if (!heading.length && !subheading.length) {
      startTyping(headingGhost.split(''), subheadingGhost.split(''))
    }
  })

  function updateHeading(next) {
    heading.update((prev) => prev + next)
  }

  function updateSubheading(next) {
    subheading.update((prev) => prev + next)
  }

  function clear() {
    heading.set('')
    subheading.set('')
  }

  // This functionality will be invoked only once
  async function startTyping(heading, subheading) {
    await type(heading.length, 0, (counter) => updateHeading(heading[counter]))
    await pause(250)
    await type(subheading.length, 0, (counter) =>
      updateSubheading(subheading[counter])
    )
  }
</script>

<style>
  .caret {
    height: var(--h1);
    width: var(--h8);
    background: var(--coral-red);
    display: inline-block;
    opacity: 0.5;
    vertical-align: middle;
    margin: 0 var(--h8);
  }

  .caret.is-active {
    animation: 1s blink step-end infinite;
  }

  @keyframes blink {
    from,
    to {
      background: transparent;
    }
    50% {
      background: var(--coral-red);
    }
  }
</style>

<div class="body">
  <div class="body-column">
    <h1 class="h1">
      {$heading}
      {#if $heading.length !== headingGhost.length}
        <span class="caret" />
      {/if}
    </h1>
    <h1 class="h1">
      {$subheading}
      {#if $subheading.length !== subheadingGhost.length}
        <span class="caret is-active" />
      {/if}
    </h1>
  </div>
</div>
