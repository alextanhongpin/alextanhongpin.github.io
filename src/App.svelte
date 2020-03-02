<script>
	import router from 'page'
	
	// Base components.
	import Header from './atomic/atoms/Header.svelte'
	import Navbar from './atomic/atoms/Navbar.svelte'
	import Footer from './atomic/atoms/Footer.svelte'

	// Pages.
	import About from './atomic/pages/About.svelte'
	import Book from './atomic/pages/Book.svelte'
	import Contact from './atomic/pages/Contact.svelte'
	import Home from './atomic/pages/Home.svelte'
	import Guitar from './atomic/pages/Guitar.svelte'
	import Programming from './atomic/pages/Programming.svelte'
	import Photography from './atomic/pages/Photography.svelte'

	// State.
	import { app } from './store'
	const { links, footer, header, username, profileImg  } = app 

	// Routing.
	let page
	let params = {}
	let route

	router('/', () => {
		route = '/'
		page = Home
	})
	router('/books', () => {
		route = '/books'
		page = Book 
	})
	router('/contacts', () => {
		route = '/contacts'
		page = Contact
	})
	router('/songs', () => {
		route = '/songs'
		page = Guitar 
	})
	router('/codes', () => {
		route = '/codes'
		page = Programming
	})
	router('/photos/:album?', (ctx, next) => {
		params = ctx.params
		route = ['/photos', params.album].filter(Boolean).join('/')
		page = Photography
	})
	/* router('/*', () => page = Error) */
	router.start()
</script>

<main>
	<Navbar {links} route={route}/>
	<Header {header} {username} {profileImg}/>
	<svelte:component this={page} params={params} />
	<Footer {footer}/>
</main>
