import { h } from 'hyperapp'
import Br from '../../atoms/Break'
import './index.css'

const page = (state, actions) => props => (
  <div class='body'>
    <div class='body-column'>
      <h1>Books I read</h1>
      <Br />
      <div class='quote'>
        you can't buy happiness but you can buy books ... and that's kind of the same thing
      </div>
      <Br />

      <div class='book-holder'>
        {
        state.books.map(book => (
          <div class='book'>{book.title} - <i>{book.author}</i></div>
        ))
      }
      </div>
      <Br row={3} />
    </div>
  </div>
)

export default page
