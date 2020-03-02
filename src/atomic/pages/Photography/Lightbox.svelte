
<script>
	import photo from '../../../store/photo'
	export let src = ''
	export let show = false
	const style = `background: url(${src}) center center / contain` 

</script>

{#if show}
  <div class='lightbox'>
	  <div class='lightbox-close'
  on:click={() => actions.hideLightbox()}
	  >&times;</div>
    <div class='lightbox-preview' {style}/>
  </div>
	{/if}
<style>


.lightbox {
    position: fixed;
    z-index: 1000;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, .9);
    text-align: center;
    display: grid;
    justify-content: center;
    align-content: center;
}

.lightbox-preview {
    width: 100vw;
    height: 100vh;
}

.lightbox-close {
    cursor: pointer;
    color: white;
    opacity: .8;
    font-size: var(--h1);
    display: inline-block;
    position: absolute;
    right: 1rem;
    top: 1rem;
    z-index: 100;
}

.lightbox-close:hover {
    opacity: 1;
}
</style>
