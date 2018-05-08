import { h } from 'hyperapp'
import { Link } from '@hyperapp/router'
import './index.css'

const component = ({ header, username = 'john doe' }) => (
  <header class='header'>
    <div class='header-column'>
      <Link class='header-brand' to='/'>{header}</Link>
      <div class='header-photo-holder'>
        <div class='header-photo' />
        <div class='header-username'>
          <h6>{username}</h6>
        </div>
      </div>
    </div>
  </header>
)

export default component
