<script>
  import { fade } from 'svelte/transition'
  import { onMount } from 'svelte'
  import state from '../../../store/photo'
  const { showThumbnail } = state.lightbox

  export let images = []
  export let folderPath
  export let onClick
  export let src

  let container

  let timeout
  const handleMousemove = () => {
    showThumbnail.set(true)
    timeout && window.clearTimeout(timeout)
    timeout = window.setTimeout(() => {
      showThumbnail.set(false)
    }, 1500)
  }

  onMount(() => {
    handleMousemove()
  })
</script>

<style>
  /* Modal. */
  .img-modal-holder {
    display: grid;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    height: 96px;
    white-space: nowrap;
    overflow-x: scroll;
    width: 100%;
    grid-auto-flow: column;
    grid-column-gap: 8px;
    grid-row-gap: 8px;
    align-items: center;
    padding: 0 8px;
    background: none;
  }
  .img-modal-holder.visible {
    background: rgba(0, 0, 0, 0.4);
  }
  .img-modal:focus,
  .img-modal:active,
  .img-modal.is-selected {
    border: 5px solid white;
    opacity: 1;
  }

  .img-modal {
    opacity: 0.8;
    height: 80px;
    width: auto;
    border-radius: 5px;
    border: 5px solid rgba(255, 255, 255, 0.6);
    box-sizing: border-box;
  }
</style>

<div
  class="img-modal-holder"
  class:visible={$showThumbnail}
  bind:this={container}
  on:mousemove={handleMousemove}>
  {#if $showThumbnail}
    {#each images as it}
      <img
        src={folderPath + it.name}
        alt={folderPath + it.name}
        class="img-modal"
        class:is-selected={folderPath + it.name === $src}
        on:click={() => onClick(folderPath + it.name)}
        transition:fade />
    {/each}
  {/if}
</div>
