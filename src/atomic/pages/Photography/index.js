import { h } from 'hyperapp'
import { Route, Link } from '@hyperapp/router'
import './index.css'

const Album = (state, actions) => ({ match }) => {
  let album = state.photos[match.params.album]
  let {images, folderPath, cameraModel, lensModel, heading, subheading} = album
  return (<div>
    <div>
      <Link to='/photos'>Back to Albums</Link>
    </div>

    <h2>{heading}</h2>
    <p>{subheading}</p>
    <br />
    <div class='img-holder'>
      {
        images.map((it) => (
          <div class='img'>
            <div class='img-placeholder'>
              <img
                src={folderPath + it.name}
                onclick={() => actions.showLightbox(folderPath + it.name)}
              />
            </div>
            <caption class='img-caption h6'>
              <span><b>{cameraModel}</b> with <i>{lensModel}</i></span>
              <span>{it.dof}</span>
              <span>{it.shutterSpeed}</span>
              <span>{it.iso}</span>
            </caption>
          </div>
        ))
      }
    </div>
  </div>)
}

// Name must be CamelCase
const MainSection = ({ match }) => (
  <div class='photo-holder'>
    <Link to='/photos/christmas-market' class='photo-grid photo-100'>
      <div class='photo-caption'>Christmas Market 2015</div>
      <img class='photo-src' src='/assets/img/photography/01-christmas_market/DSCF2052_small.jpg' />
    </Link>

    <Link to='/photos/malaysia' class='photo-grid photo-200'>
      <div class='photo-caption'>Kuala Lumpur</div>
      <img class='photo-src' src='/assets/img/photography/02-malaysia/DSCF2336_small.jpg' />
    </Link>

    <Link to='/photos/danboard' class='photo-grid photo-300'>
      <div class='photo-caption'>Danboard</div>
      <img class='photo-src' src='/assets/img/photography/06-danboard/IMG_4735_edited_small.jpg' />
    </Link>

    <Link to='/photos/preiser-figure' class='photo-grid photo-400'>
      <div class='photo-caption'>Preiser Figure</div>
      <img class='photo-src' src='/assets/img/photography/07-preiser_figure/06_small.jpg' />
    </Link>

    <Link to='/photos/berlin' class='photo-grid photo-500'>
      <div class='photo-caption'>Berlin</div>
      <img class='photo-src' src='/assets/img/photography/05-berlin_trip/DSCF2626_small.jpeg' />
    </Link>
  </div>
)

const Lightbox = (state, actions) => () => (
  <div class='lightbox'>
    <div class='lightbox-close' onclick={() => actions.hideLightbox()}>&times;</div>
    <img src={state.lightbox.src} />
  </div>
)

const page = (state, actions) => ({ match }) => (
  <div class='body'>
    <div class='body-column'>
      <br />
      <br />
      <br />
      { state.lightbox.show && Lightbox(state, actions)}
      {/* The default page to show when the user visits /photos */}
      { match.isExact && <MainSection match={match} /> }

      {/* If a subpath exist, e.g. photos/night-market, show them instead */}
      <Route parent path={`${match && match.path}/:album`} render={Album(state, actions)} />
      <br />
      <br />
      <br />
    </div>
  </div>
)

export default page
