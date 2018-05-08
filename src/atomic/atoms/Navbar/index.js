import { h } from 'hyperapp'
import { Link } from '@hyperapp/router'
import './index.css'

const component = ({ links, route }) => (
  <navbar class='navbar'>
    { 
      links.map(link => (
        <Link class={
          `navbar-link ${link.to === route && "is-selected"}`
        } to={link.to}>{link.label}</Link>
      ))
    }
  </navbar>
)

export default component
