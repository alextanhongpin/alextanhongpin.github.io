// import 'babel-polyfill'
import { app, h } from 'hyperapp'
import { Route, location } from '@hyperapp/router'

import 'normalize.css'
import './index.css'

// Atoms
import Header from './atomic/atoms/Header'
import Navbar from './atomic/atoms/Navbar'
import Footer from './atomic/atoms/Footer'

// Pages
import BookPage from './atomic/pages/Book'
import HomePage from './atomic/pages/Home'
import AboutPage from './atomic/pages/About'
import PhotographyPage from './atomic/pages/Photography'
import GuitarPage from './atomic/pages/Guitar'
import ContactPage from './atomic/pages/Contact'

// Modules
import typewriterModule from './store/typewriter'
import bookModule from './store/book'
import photographyModule from './store/photo'
import guitarModule from './store/guitar'

const state = Object.assign({}, {
  header: 'alextanhongpin',
  username: 'Alex Tan',
  footer: `Copyright © ${new Date().getFullYear()} alextanhongpin`,
  profileImg: './assets/img/profile.jpg',
  // Register state for @hyperapp/router
  location: location.state,
  links: [
    {
      to: '/',
      label: 'Home'
    },
    // {
    //   to: '/about',
    //   label: 'About'
    // },
    {
      to: '/contacts',
      label: 'Contact'
    },
    {
      to: '/photos',
      label: 'Photo'
    },
    {
      to: '/books',
      label: 'Book'
    },
    {
      to: '/songs',
      label: 'Guitar'
    }
  ]
},
typewriterModule.state,
bookModule.state,
photographyModule.state,
guitarModule.state)

const actions = Object.assign({}, {
  // Register actions for @hyperapp/router
  location: location.actions
}, typewriterModule.actions)

const view = (state, actions) => (
  <main class='main'>
    <Header header={state.header} username={state.username} profileImg={state.profileImg} />
    <Navbar links={state.links} route={state.location.pathname} />

    <Route path='/' render={HomePage(state, actions)} />
    <Route path='/about' render={AboutPage} />
    <Route path='/photos' render={PhotographyPage} />
    <Route path='/books' render={BookPage(state, actions)} />
    <Route path='/songs' render={GuitarPage(state, actions)} />
    <Route path='/contacts' render={ContactPage(state, actions)} />

    <Footer footer={state.footer} />
  </main>
)

const main = app(state, actions, view, document.body)

// Register @hyperapp/router
location.subscribe(main.location)
