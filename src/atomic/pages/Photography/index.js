import { h } from 'hyperapp'
import './index.css'

const page = (state, actions) => props => (
  <div class='body'>
    <div class='body-column'>
      <br />
      <br />
      <br />
      <div class='photo-holder'>
        <div class='photo-grid photo-100'>
          <div class='photo-caption'>Christmas Market 2015</div>
          <img class='photo-src' src='./assets/img/photography/01-christmas_market/DSCF2052_small.jpg' />
        </div>

        <div class='photo-grid photo-200'>
          <div class='photo-caption'>Kuala Lumpur</div>
          <img class='photo-src' src='./assets/img/photography/02-malaysia/DSCF2336_small.jpg' />
        </div>

        <div class='photo-grid photo-300'>
          <div class='photo-caption'>Danboard</div>
          <img class='photo-src' src='./assets/img/photography/06-danboard/IMG_4735_edited_small.jpg' />
        </div>

        <div class='photo-grid photo-400'>
          <div class='photo-caption'>Preiser Figure</div>
          <img class='photo-src' src='./assets/img/photography/07-preiser_figure/06_small.jpg' />
        </div>
      </div>
      <br />
      <br />
      <br />
    </div>
  </div>
)

export default page
