<script>
	import state from '../../store/guitar'
	const { songs } = state
</script>

  <div class='body'>
    <div class='body-column'>
      <h1 class='h1'>Songs I play</h1>

      <p>
        I don't play guitar as much as I do anymore. These are some of the fingerstyle guitar solos that I recorded using <i>Zoom H1</i>. Enjoy!
      </p>
      <br />
      
      <div class='quote'>
        I just want to be a guy with a guitar - <i><small>Jeff Buckley</small></i>
      </div>
      <br />
      <br />

      <div class='guitar-holder'>
	      {#each songs as song}
		  <div class='guitar'>
		    <iframe width='100%' height='166' scrolling='no' frameborder='no' allow='autoplay' src={song} title=''/>
		  </div>
	      {/each}
      </div>

      <br/>
    </div>
  </div>

export default page
<style>
.guitar-holder {
  display: grid;
  grid-row-gap: var(--base-line-height);
}
</style>

