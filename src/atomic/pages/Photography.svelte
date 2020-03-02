<script>
	import Main from './Photography/Main.svelte'
	import Album from './Photography/Album.svelte'
	import Lightbox from './Photography/Lightbox.svelte'

	import photo from '../../store/photo'
	const { show, src } = photo.state.lightbox
	export let params
	$: isMain = params.album === undefined || params.album === '' 
</script>

<div class='body'>
  <div class='body-column'>
    <br />
    <br />
    <br />

    <Lightbox src={$src} show={$show}/>

    {#if isMain}
      <Main/>
    {:else}
      <Album {params}/>
    {/if}

    <br />
    <br />
    <br />
  </div>
</div>
