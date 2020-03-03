<style>
  .photo-holder {
    width: 100%;
    max-width: var(--max-width);

    display: grid;
    grid-template-columns: 1fr;
    grid-row-gap: var(--h4);
    align-content: center;
    align-items: center;
    align-self: center;
    justify-items: center;
  }

  .photo-album-link {
    display: block;
    position: relative;
    transition: 0.174s all ease-out;
    border: var(--h8) solid white;

    width: 100%;
    max-width: 480px;

    font-weight: bold;
    font-size: var(--h4);
    line-height: 0;
    text-align: center;

    color: white;
    background: rgba(0, 0, 0, 0.4);
    box-shadow: 0 var(--h8) var(--h4) rgba(0, 0, 0, 0.25);
  }
  @media (max-width: 480px) {
    .photo-album-link {
      max-width: 400px;
    }
  }
  .photo-album-link:hover:before {
    content: attr(data-title);
    color: white;
    font-size: var(--h4);
    font-weight: bold;

    z-index: 1000;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    display: grid;
    width: 100%;
    height: 100%;

    align-content: center;
    justify-content: center;

    background: rgba(0, 0, 0, 0.4);
    transition: 0.134s all ease-out;
  }
  .photo-album {
    height: auto;
    width: 100%;
  }

  .photo-album-link:nth-child(n) {
    opacity: 0;
    transform: rotateZ(-6deg) translateY(-32px);
    animation: rotate100 0.5s 0.25s ease-out forwards;
  }
  .photo-album-link:nth-child(2n) {
    opacity: 0;
    transform-origin: left top;
    transform: rotateZ(3deg) translateY(-32px);
    animation: rotate200 0.3s 0.5s ease-out forwards;
  }
  .photo-album-link:nth-child(3n) {
    opacity: 0;
    transform: rotateZ(0) scale(0.95) translateY(-16px);
    animation: rotate300 0.4s 0.75s ease-out forwards;
  }
  .photo-album-link:nth-child(4n) {
    opacity: 0;
    transform: rotateZ(6deg) translateX(-16px);
    animation: rotate400 0.4s 1s ease-out forwards;
  }
  .photo-album-link:nth-child(5n) {
    opacity: 0;
    transform: rotateZ(3deg) translateX(-9px);
    animation: rotate500 0.4s 1s ease-out forwards;
  }

  @keyframes rotate100 {
    to {
      opacity: 1;
      transform: rotateZ(-9deg) translateY(0);
      box-shadow: 0 var(--h8) var(--h4) rgba(0, 0, 0, 0.25);
    }
  }
  @keyframes rotate200 {
    to {
      opacity: 1;
      transform: rotateZ(6deg) translateY(0);
      box-shadow: 0 var(--h8) var(--h4) rgba(0, 0, 0, 0.25);
    }
  }
  @keyframes rotate300 {
    to {
      opacity: 1;
      transform: rotateZ(-3deg) scale(0.975) translateY(0);
      box-shadow: 0 var(--h8) var(--h4) rgba(0, 0, 0, 0.25);
    }
  }
  @keyframes rotate400 {
    to {
      opacity: 1;
      transform: rotateZ(9deg) translateX(0);
      box-shadow: 0 var(--h8) var(--h4) rgba(0, 0, 0, 0.25);
    }
  }
  @keyframes rotate500 {
    to {
      opacity: 1;
      transform: rotateZ(-3deg) translateX(0);
      box-shadow: 0 var(--h8) var(--h4) rgba(0, 0, 0, 0.25);
    }
  }
</style>

<div class="photo-holder">
  <a
    href="/photos/christmas-market"
    data-title="Christmas Market 2015"
    class="photo-album-link">
    <img
      class="photo-album"
      src="/assets/img/photography/01-christmas_market/DSCF2052_small.jpg"
      alt="christmas market" />
  </a>

  <a href="/photos/malaysia" data-title="Kuala Lumpur" class="photo-album-link">
    <img
      class="photo-album"
      src="/assets/img/photography/02-malaysia/DSCF2336_small.jpg"
      alt="malaysia" />
  </a>

  <a href="/photos/kl-life" data-title="KL Life" class="photo-album-link">
    <img
      class="photo-album"
      src="/assets/img/photography/11-kl-life/DSCF3511.jpg"
      alt="kl-life" />
  </a>

  <a href="/photos/danboard" data-title="Danboard" class="photo-album-link">
    <img
      class="photo-album"
      src="/assets/img/photography/06-danboard/IMG_4735_edited_small.jpg"
      alt="danboard" />
  </a>

  <a
    href="/photos/preiser-figure"
    data-title="Preiser Figure"
    class="photo-album-link">
    <img
      class="photo-album"
      src="/assets/img/photography/07-preiser_figure/06_small.jpg"
      alt="preiser" />
  </a>

  <a href="/photos/berlin" data-title="Berlin" class="photo-album-link">
    <img
      class="photo-album"
      src="/assets/img/photography/05-berlin_trip/DSCF2626_small.jpeg"
      alt="berlin" />
  </a>

  <a
    href="/photos/singapore-ndp-2018"
    data-title="NDP Singapore, 2018"
    class="photo-album-link">
    <img
      class="photo-album"
      src="/assets/img/photography/08-ndp-singapore/DSCF3973.jpg"
      alt="ndp singapore" />
  </a>

  <a
    href="/photos/singapore-clarke-quay"
    data-title="Clarke Quay, Singapore"
    class="photo-album-link">
    <img
      class="photo-album"
      src="/assets/img/photography/10-singapore-clarke-quay/DSCF3677.jpg"
      alt="clarke quay, singapore" />
  </a>

  <a
    href="/photos/singapore-clarke-quay"
    data-title="Singapore Life"
    class="photo-album-link">
    <img
      class="photo-album"
      src="/assets/img/photography/09-singapore-chinatown/DSCF3734.jpg"
      alt="singapore life" />
  </a>

  <a
    href="/photos/singapore-life"
    data-title="Singapore Life"
    class="photo-album-link">
    <img
      class="photo-album"
      src="/assets/img/photography/12-singapore-life/DSCF3993.JPG"
      alt="singapore life" />
  </a>

  <a href="/photos/bali" data-title="Bali, Indonesia" class="photo-album-link">
    <img
      class="photo-album"
      src="/assets/img/photography/13-bali/DSCF4233.JPG"
      alt="bali, indonesia" />
  </a>
</div>
