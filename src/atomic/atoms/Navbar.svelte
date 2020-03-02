<script>
	export let links = []
	export let route = '/'

console.log(route)
</script>

  <navbar class='navbar'>
  {#each links as link (link.label)}
	  <a href={link.to} class='navbar-link' class:is-selected={link.to === route ? true : link.to !== '/' && route.startsWith(link.to)}>
        {link.label}
      </a>
  {/each}
  </navbar>

<style>
.navbar {
    background: var(--gallery);
    display: block;
    height: var(--navbar-height);
    line-height: var(--navbar-height);
    display: grid;
    grid-column-gap: 16px;
    font-size: var(--h6);
    /* Hardcoded to allow only five columns */
    grid-template-columns: repeat(6, max-content);
    justify-content: flex-end;
    box-shadow: inset 0 -5px 15px rgba(0, 0, 0, .05);
}

.navbar-link {
    display: inline-block;
    text-decoration: none;
    color: inherit;
}

.navbar-link.is-selected {
    font-weight: bold;
    border-bottom: 3px solid var(--coral-red);
}
</style>
