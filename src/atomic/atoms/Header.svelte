<script>
	export let header;
	export let username;
	export let profileImg;
</script>


<header class='header'>
	<div class='header-column'>
	<div class='header-brand'>{header}</div>
	<div class='header-photo-holder'>
	<div class='header-photo'
		style='background: url({profileImg}) no-repeat center center / cover;'
	/>
	<div class='header-username'>
	  <h6>{username}</h6>
	</div>
	</div>
	</div>
</header>
<style>
.header {
	height: var(--header-height);
	display: grid;
}

.header-brand {
	text-decoration: none;
	color: var(--coral-red);
	border: 3px solid var(--coral-red);
	box-sizing: content-box;
	display: inline-block;
	height: var(--brand-height);
	line-height: var(--brand-height);
	padding: 0 16px;
	font-weight: bold;
	border-radius: 3px;
	justify-self: flex-start;
}

.header-column {
	max-width: var(--max-width);
	width: 100%;
	margin: auto;

	display: grid;
	grid-template-columns: 1fr 1fr;
	align-content: center;
}

.header-photo-holder {
	justify-self: flex-end;
	display: grid;
	grid-template-columns: auto auto;
	grid-column-gap: 8px;
	align-items: center;
	padding: 0 8px;
	border-radius: 3px;
	cursor: pointer;
}

.header-photo-holder:hover {
	background: var(--gallery);
}

.header-username {
	font-weight: 500;
}

.header-photo {
	background: white;
	border: 1px solid var(--gallery);
	height: 30px;
	width: 30px;
	border-radius: 50%;
}
</style>

