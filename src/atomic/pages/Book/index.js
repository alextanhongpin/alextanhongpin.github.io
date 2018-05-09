import { h } from 'hyperapp'
import './index.css'

const page = (state, actions) => props => (
  <div class='body'>
    <div class='body-column'>
      <br />
      <h1>Books I read</h1>
      <br />
      <div class='quote'>
        you can't buy happiness but you can buy books ... and that's kind of the same thing
      </div>
      <br />

      <div class='book-holder'>
        {
        state.books.map(book => (
          <div class='book'>{book.title} - <i>{book.author}</i></div>
        ))
      }
      </div>
      <br />
      <br />
      <br />
    </div>
  </div>
)

export default page
