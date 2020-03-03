<script>
  import { onMount } from 'svelte'
  import state from '../../../store/photo'
  import AlbumModal from './AlbumModal.svelte'

  export let params
  const { photos, lightbox } = state
  let {
    images,
    folderPath,
    cameraModel,
    lensModel,
    heading,
    subheading,
  } = photos[params.album]

  function showLightbox(src) {
    lightbox.src.set(src)
    lightbox.show.set(true)
  }

  const { show, src } = lightbox
</script>

<style>
  .img {
    width: 100%;
  }
  .img img {
    width: 100%;
    height: auto;
    filter: grayscale(1);
    transition: 0.25s all ease-out;
    border: var(--h8) solid white;
    box-shadow: 0 var(--h8) var(--h4) rgba(0, 0, 0, 0.15);
    box-sizing: border-box;
  }
  .img img:hover {
    filter: grayscale(0);
  }
  .img-placeholder {
    min-height: 250px;
  }
  .img-caption {
    display: grid;
    justify-content: flex-start;
    grid-template-columns: repeat(4, auto);
    grid-column-gap: var(--base-line-height);
    color: var(--gray);
  }
  .img-holder {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-column-gap: calc(var(--base-line-height) * 1.5);
    grid-row-gap: calc(var(--base-line-height) * 1.5);
  }

  @media (max-width: 960px) {
    .img-holder {
      grid-template-columns: 1fr;
    }
  }
</style>

<div>
  <div>
    <a href="/photos">Back to Albums</a>
  </div>

  <h2>{heading}</h2>
  <p>{subheading}</p>
  <br />

  {#if $show}
    <AlbumModal {images} {folderPath} onClick={showLightbox} {src} />
  {:else}
    <div class="img-holder">
      {#each images as it}
        <div class="img">
          <div class="img-placeholder">
            <img
              alt={it.name}
              src={folderPath + it.name}
              on:click={() => showLightbox(folderPath + it.name)} />
          </div>
          <caption class="img-caption h6">
            <span>
              <b>{cameraModel}</b>
              with
              <i>{lensModel}</i>
            </span>
            <span>{it.dof.includes('f/') ? it.dof : 'f/' + it.dof}</span>
            <span>
              {it.shutterSpeed.includes('sec') ? it.shutterSpeed : it.shutterSpeed + ' sec'}
            </span>
            <span>ISO {it.iso}</span>
          </caption>
        </div>
      {/each}
    </div>
  {/if}
</div>
