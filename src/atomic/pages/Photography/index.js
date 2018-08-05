import { h } from 'hyperapp'
import { Route, Link } from '@hyperapp/router'
import './index.css'

const topic = ({ match }) => <h3>{match.params.topicId}</h3>

// Name must be CamelCase
const MainSection = ({ match }) => (
  <div class='photo-holder'>
    <Link to='/photos/night-market'>
      <div class='photo-grid photo-100'>
        <div class='photo-caption'>Christmas Market 2015</div>
        <img class='photo-src' src='/assets/img/photography/01-christmas_market/DSCF2052_small.jpg' />
      </div>
    </Link>

    <div class='photo-grid photo-200'>
      <div class='photo-caption'>Kuala Lumpur</div>
      <img class='photo-src' src='/assets/img/photography/02-malaysia/DSCF2336_small.jpg' />
    </div>

    <div class='photo-grid photo-300'>
      <div class='photo-caption'>Danboard</div>
      <img class='photo-src' src='/assets/img/photography/06-danboard/IMG_4735_edited_small.jpg' />
    </div>

    <div class='photo-grid photo-400'>
      <div class='photo-caption'>Preiser Figure</div>
      <img class='photo-src' src='/assets/img/photography/07-preiser_figure/06_small.jpg' />
    </div>
  </div>
)

const page = (state, actions) => ({ match }) => (
  <div class='body'>
    <div class='body-column'>
      <br />
      <br />
      <br />
      {/* The default page to show when the user visits /photos */}
      { match.isExact && <MainSection match={match} /> }

      {/* If a subpath exist, e.g. photos/night-market, show them instead */}
      <Route parent path={`${match && match.path}/:topicId`} render={topic} />
      <br />
      <br />
      <br />
    </div>
  </div>
)

export default page
