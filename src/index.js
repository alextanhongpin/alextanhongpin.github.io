import 'babel-polyfill'
import { app, h } from 'hyperapp'
import { Route, location } from '@hyperapp/router'

import 'normalize.css'
import './index.css'

// Atoms
import Header from './atomic/atoms/Header'
import Navbar from './atomic/atoms/Navbar'
import Footer from './atomic/atoms/Footer'

// Pages
import HomePage from './atomic/pages/Home'
import AboutPage from './atomic/pages/About'

// Utils
import type from './utils/type'
import pause from './utils/pause'

// Modules
import typewriterModule from './store/typewriter'

const state = {
  header: 'alextanhongpin',
  username: 'Alex Tan',
  footer: `Copyright © ${new Date().getFullYear()} alextanhongpin`,
  ...typewriterModule.state,
  // Register state for @hyperapp/router
  location: location.state,
  links: [
    {
      to: '/',
      label: 'Home'
    },
    {
      to: '/about',
      label: 'About'
    },
    {
      to: '/books',
      label: 'Books'
    }
  ]
}

const actions = {
  // Register actions for @hyperapp/router
  location: location.actions,
  ...typewriterModule.actions
}

const view = (state, actions) => (
  <main class='main'>
    <Header header={state.header} username={state.username} />
    <Navbar links={state.links} route={state.location.pathname}/>

    <Route path='/' render={HomePage(state, actions)} />
    <Route path='/about' render={AboutPage} />

    <Footer footer={state.footer} />
  </main>
)

const main = app(state, actions, view, document.body)

// Register @hyperapp/router
location.subscribe(main.location)

async function startTyping (app, heading, subheading) {
  await type(heading.length, 0, counter => app.updateHeading(heading[counter]))
  await pause(250)
  await type(subheading.length, 0, counter => app.updateSubheading(subheading[counter]))
}

startTyping(
  main,
  state.headingGhost.split(''),
  state.subheadingGhost.split('')
)
