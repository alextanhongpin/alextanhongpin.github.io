<script>
  import router from 'page'

  // Base components.
  import Header from './atomic/atoms/Header.svelte'
  import Navbar from './atomic/atoms/Navbar.svelte'
  import Footer from './atomic/atoms/Footer.svelte'

  // Pages.
  // import About from './atomic/pages/About.svelte'
  import Book from './atomic/pages/Book.svelte'
  import Contact from './atomic/pages/Contact.svelte'
  import Home from './atomic/pages/Home.svelte'
  import Guitar from './atomic/pages/Guitar.svelte'
  import Programming from './atomic/pages/Programming.svelte'
  import Photography from './atomic/pages/Photography.svelte'
  import Project from './atomic/pages/Project.svelte'

  // State.
  import { app } from './store'
  const { links, footer, header, username, profileImg } = app

  let path = ''
  let page = Home
  let params = {}

  router('/', (ctx) => {
    path = ctx.state.path
    page = Home
  })
  router('/books', (ctx) => {
    path = ctx.state.path
    page = Book
  })
  router('/contacts', (ctx) => {
    path = ctx.state.path
    page = Contact
  })
  router('/songs', (ctx) => {
    path = ctx.state.path
    page = Guitar
  })
  router('/codes', (ctx) => {
    path = ctx.state.path
    page = Programming
  })
  router('/photos/:album?', (ctx) => {
    page = Photography
    path = ctx.state.path
    params = ctx.params
  })
  router('/projects', (ctx) => {
    page = Project
    path = ctx.state.path
    params = ctx.params
  })
  // router('/*', () => page = Error)
  router.start()
</script>

<main>
  <Navbar {links} route={path} />
  <Header {header} {username} {profileImg} />
  <svelte:component this={page} {params} />
  <Footer {footer} />
</main>
