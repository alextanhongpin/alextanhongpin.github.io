<script>
  import { fade } from 'svelte/transition'
  import { onMount } from 'svelte'
  import state from '../../../store/photo'
  const { show, showThumbnail } = state.lightbox

  export let images = []
  export let folderPath
  export let onClick
  export let src

  let container

  let timeout
  const setVisible = () => {
    showThumbnail.set(true)
    timeout && window.clearTimeout(timeout)
  }
  const handleMouseEnter = () => {
    setVisible()
  }
  const handleMouseLeave = () => {
    timeout && window.clearTimeout(timeout)
    timeout = window.setTimeout(() => {
      showThumbnail.set(false)
    }, 1000)
  }
  const handleKeyDown = (evt) => {
    switch (evt.keyCode) {
      case 37: {
        evt.preventDefault()
        setVisible()
        const index = images.findIndex(function (it) {
          return folderPath + it.name === $src
        })
        container.scrollLeft =
          (container.scrollWidth / images.length) * (index - 1) -
          window.innerWidth / 2
        onClick(folderPath + images[Math.max(index - 1, 0)].name)
        return
      }
      case 39: {
        evt.preventDefault()
        setVisible()
        const index = images.findIndex(function (it) {
          return folderPath + it.name === $src
        })
        container.scrollLeft =
          (container.scrollWidth / images.length) * (index + 1) -
          window.innerWidth / 2
        onClick(
          folderPath + images[Math.min(index + 1, images.length - 1)].name
        )
        return
      }
      default:
    }
  }

  onMount(() => {
    handleMouseLeave()
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

<svelte:window on:keydown={handleKeyDown} />
{#if $show}
  <div
    class="img-modal-holder"
    class:visible={$showThumbnail}
    bind:this={container}
    on:mouseleave={handleMouseLeave}
    on:mouseenter={handleMouseEnter}>
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
{/if}
