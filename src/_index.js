import { app, h } from 'hyperapp'

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
import ProgrammingPage from './atomic/pages/Programming'

// Modules
import typewriterModule from './store/typewriter'
import bookModule from './store/book'
import photographyModule from './store/photo'
import guitarModule from './store/guitar'


const actions = Object.assign(
  {},
  {
    // Register actions for @hyperapp/router
    location: location.actions,
    ...typewriterModule.actions,
    ...photographyModule.actions
  }
)

const view = ({ header, username, profileImg, links, footer }) => (
  <main class='main'>
    <Header header={header} username={username} profileImg={profileImg} />
  </main>
)

// <Navbar links={links} />
// <Footer footer={footer} />
// <Route path='/' render={HomePage(state, actions)} />
//
// <Route path='/about' render={AboutPage} />
// <Route parent path='/photos' render={PhotographyPage(state, actions)} />
// <Route path='/books' render={BookPage(state, actions)} />
// <Route path='/songs' render={GuitarPage(state, actions)} />
// <Route path='/contacts' render={ContactPage(state, actions)} />
// <Route path='/codes' render={ProgrammingPage(state, actions)} />

app({
  node: document.getElementById('app'),
  view: state => view(state),
  init: state
})
