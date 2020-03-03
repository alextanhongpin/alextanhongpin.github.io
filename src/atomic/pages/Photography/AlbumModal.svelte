<script>
  import { onMount } from 'svelte'

  export let images = []
  export let folderPath
  export let onClick
  export let src

  let container
  onMount(() => {
    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(
        entries => {
          const intersecting = entries[0].isIntersecting
          if (!intersecting) {
            src.set(entries[0].target.alt)
          }
        },
        {
          threshold: 1,
          rootMargin: '0px 0px 0px 100%',
        }
      )
      container
        .querySelectorAll('.img-modal')
        .forEach($el => observer.observe($el))
      return () => {
        container
          .querySelectorAll('.img-modal')
          .forEach($el => observer.unobserve($el))
      }
    }
  })
</script>

<style>
  /* Modal. */
  .img-modal-holder {
    background: rgba(0, 0, 0, 0.4);
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


<div class="img-modal-holder" bind:this={container}>
  {#each images as it}
    <img
      src={folderPath + it.name}
      alt={folderPath + it.name}
      class="img-modal"
      class:is-selected={folderPath + it.name === $src}
      on:click={() => onClick(folderPath + it.name)} />
  {/each}
</div>
