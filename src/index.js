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

const state = {
  header: 'alextanhongpin',
  username: 'Alex Tan',
  footer: `Copyright © ${new Date().getFullYear()} alextanhongpin`,
  // Typing animation
  heading: '',
  headingGhost: 'Hi, I am Alex.',
  subheading: '',
  subheadingGhost: 'This is my journey as a Developer.',
  // Register state for @hyperapp/router
  location: location.state
}

const actions = {
  // Register actions for @hyperapp/router
  location: location.actions,
  updateHeading: value => state => ({
    heading: state.heading + value
  }),
  updateSubheading: value => state => ({
    subheading: state.subheading + value
  })
}

const view = (state, actions) => (
  <main class='main'>
    <Header header={state.header} username={state.username} />
    <Navbar />

    <Route path='/' render={HomePage(state, actions)} />
    <Route path='/about' render={AboutPage} />

    <Footer footer={state.footer} />
  </main>
)

const main = app(state, actions, view, document.body)

async function startTyping (heading, subheading) {
  await type(heading.length, 0, counter => main.updateHeading(heading[counter]))
  await pause(250)
  await type(subheading.length, 0, counter => main.updateSubheading(subheading[counter]))
}

startTyping(
  state.headingGhost.split(''),
  state.subheadingGhost.split('')
)

// Register @hyperapp/router
location.subscribe(main.location)
