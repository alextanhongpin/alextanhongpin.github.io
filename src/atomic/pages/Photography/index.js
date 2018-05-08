import { h } from 'hyperapp'
import './index.css'

const page = (state, actions) => props => (
  <div class='body'>
    <div class='body-column'>
			<div class='photo-grid'>
				<div class='photo-caption'>Christmas Market 2015</div>
				<img class='photo-src' src='./assets/img/photography/01-christmas_market/DSCF2043_small.jpeg'/>
			</div>
    </div>
  </div>
)

export default page
