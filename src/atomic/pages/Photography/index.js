import { h } from 'hyperapp'
import { Route, Link } from '@hyperapp/router'
import './index.css'

const Album = (state, actions) => ({ match }) => {
  let album = state.photos[match.params.album]
  let { images, folderPath, cameraModel, lensModel, heading, subheading } = album
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
              <span>{it.dof.includes('f/') ? it.dof : 'f/' + it.dof}</span>
              <span>{it.shutterSpeed.includes('sec') ? it.shutterSpeed : it.shutterSpeed + ' sec'}</span>
              <span>ISO {it.iso}</span>
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
    <Link
      to='/photos/christmas-market'
      data-title='Christmas Market 2015'
      class='photo-album-link'>
      <img class='photo-album' src='/assets/img/photography/01-christmas_market/DSCF2052_small.jpg' />
    </Link>

    <Link
      to='/photos/malaysia'
      data-title='Kuala Lumpur'
      class='photo-album-link'>
      <img class='photo-album' src='/assets/img/photography/02-malaysia/DSCF2336_small.jpg' />
    </Link>

    <Link
      to='/photos/kl-life'
      data-title='KL Life'
      class='photo-album-link'>
      <img class='photo-album' src='/assets/img/photography/11-kl-life/DSCF3511.jpg' />
    </Link>

    <Link
      to='/photos/danboard'
      data-title='Danboard'
      class='photo-album-link'>
      <img class='photo-album' src='/assets/img/photography/06-danboard/IMG_4735_edited_small.jpg' />
    </Link>

    <Link
      to='/photos/preiser-figure'
      data-title='Preiser Figure'
      class='photo-album-link'>
      <img class='photo-album' src='/assets/img/photography/07-preiser_figure/06_small.jpg' />
    </Link>

    <Link to='/photos/berlin'
      data-title='Berlin'
      class='photo-album-link'>
      <img class='photo-album' src='/assets/img/photography/05-berlin_trip/DSCF2626_small.jpeg' />
    </Link>

    <Link
      to='/photos/singapore-ndp-2018'
      data-title='NDP Singapore, 2018'
      class='photo-album-link'>
      <img class='photo-album' src='/assets/img/photography/08-ndp-singapore/DSCF3973.jpg' />
    </Link>

    <Link
      to='/photos/singapore-clarke-quay'
      data-title='Clarke Quay, Singapore'
      class='photo-album-link'>
      <img class='photo-album' src='/assets/img/photography/10-singapore-clarke-quay/DSCF3677.jpg' />
    </Link>

    <Link
      to='/photos/singapore-clarke-quay'
      data-title='Singapore Life'
      class='photo-album-link'>
      <img class='photo-album' src='/assets/img/photography/09-singapore-chinatown/DSCF3734.jpg' />
    </Link>

    <Link
      to='/photos/singapore-life'
      data-title='Singapore Life'
      class='photo-album-link'>
      <img class='photo-album' src='/assets/img/photography/12-singapore-life/DSCF3993.JPG' />
    </Link>

    <Link
      to='/photos/bali'
      data-title='Bali, Indonesia'
      class='photo-album-link'>
      <img class='photo-album' src='/assets/img/photography/13-bali/DSCF4233.JPG' />
    </Link>
  </div>
)

const Lightbox = (state, actions) => () => (
  <div class='lightbox'>
    <div class='lightbox-close' onclick={() => actions.hideLightbox()}>&times;</div>
    <div class='lightbox-preview' style={{ background: `url(${state.lightbox.src}) center center no-repeat / contain` }} />
    {/* <img src={state.lightbox.src} /> */}
  </div>
)

const page = (state, actions) => ({ match }) => (
  <div class='body'>
    <div class='body-column'>
      <br />
      <br />
      <br />
      {state.lightbox.show && Lightbox(state, actions)}
      {/* The default page to show when the user visits /photos */}
      {match.isExact && <MainSection match={match} />}

      {/* If a subpath exist, e.g. photos/night-market, show them instead */}
      <Route parent path={`${match && match.path}/:album`} render={Album(state, actions)} />
      <br />
      <br />
      <br />
    </div>
  </div>
)

export default page
