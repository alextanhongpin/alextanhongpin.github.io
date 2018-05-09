import { h } from 'hyperapp'
import './index.css'

const page = (state, actions) => props => (
  <div class='body'>
    <div class='body-column'>
      <br />
      <h1>Songs I play</h1>

      <p>
        I don't play guitar as much as I do anymore. These are some of the fingerstyle guitar solos that I recorded using <i>Zoom H1</i>. Enjoy!
      </p>

      <div class='quote'>
        I just want to be a guy with a guitar - <i><small>Jeff Buckley</small></i>
      </div>
      <br />
      <div class='guitar-holder'>
        {
        state.songs.map(song => (
          <div class='guitar'>
            <iframe width='100%' height='166' scrolling='no' frameborder='no' allow='autoplay' src={song} />
          </div>
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
