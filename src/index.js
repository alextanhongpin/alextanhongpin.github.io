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

const state = {
  header: 'alextanhongpin',
  username: 'Alex',
  footer: `Copyright © ${new Date().getFullYear()} alextanhongpin`,
  // Register state for @hyperapp/router
  location: location.state
}

const actions = {
  // Register actions for @hyperapp/router
  location: location.actions
}

const view = (state, actions) => (
  <main class="main">
    <Header header={state.header} username={state.username}/>
    <Navbar/>

    <Route path="/" render={HomePage}/>
    <Route path="/about" render={AboutPage}/>

    <Footer footer={state.footer}/>
  </main>
)

const main = app(state, actions, view, document.body)

// Register @hyperapp/router
const unsubscribe = location.subscribe(main.location)
