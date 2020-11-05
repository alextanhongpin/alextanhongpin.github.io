<script>
  import Modal from '../atoms/Modal.svelte'
  import Finanz from './Project/Finanz.svelte'
  import GithubRecommender from './Project/GithubRecommender.svelte'
  import PersonalWebsite from './Project/PersonalWebsite.svelte'
  import Hire from './Project/Hire.svelte'
  import AskAndAnswer from './Project/AskAndAnswer.svelte'

  let showModal = false
</script>

<style>
  .blocks {
    display: grid;
    grid-template-columns: 1fr;
    grid-column-gap: 1rem;
    grid-row-gap: 1rem;
  }
  .block:not(:last-child) {
    padding-bottom: 2rem;
    border-bottom: 1px dashed var(--gray);
  }
</style>

<div class="body">
  <div class="body-column">
    <h1 class="h1">Projects</h1>
    <p>
      I like writing code. I like building product. I like making things that
      people like. -
      <i>Paul Buccheit</i>
    </p>

    <br />

    <div>
      <h4>Table of Content</h4>
      <ul>
        <li><a href="#my-personal-website">My Personal Website</a></li>
        <li><a href="#finanz">Finanz | Visualize Your Expenses</a></li>
        <li><a href="#github-recommender">Github Recommender</a></li>
        <li><a href="#hire">Hire | Paperless Applicant Tracking System</a></li>
        <li><a href="#ask-and-answer">Ask & Answer</a></li>
      </ul>
    </div>
    <div class="blocks">
      <div class="block">
        <PersonalWebsite />
      </div>
      <div class="block">
        <Finanz />
      </div>
      <div class="block">
        <GithubRecommender />
      </div>
      <div class="block">
        <Hire />
      </div>
      <div class="block">
        <AskAndAnswer />
      </div>
    </div>

    {#if showModal}
      <Modal on:close={() => (showModal = false)}>
        <div slot="header">
          <h3>My Personal Website</h3>
          <p>19 May 2020</p>
        </div>

        <p>It was Jun 2014 that I decided to create my personal website.</p>
        <p>
          With my limited knowledge in HTML and CSS, I designed my website with
          as little code as possible. That aligns with the principle
          <a
            href="https://wiki.c2.com/?MakeItWorkMakeItRightMakeItFast"
            target="_blank"
            rel="noopener noreferrer">
            make it work, make it right, make it fast
          </a>
          . 😊
        </p>

        <h4>Technology Stack</h4>

        <p>
          I have rewritten the site a few times over the years, mainly to keep
          up to date with new technologies. But simplicity is still at its core.
        </p>

        <ul>
          <li>
            <b>Past</b>
            - from vanilla JavaScript to jQuery to Backbone.js to hyperapp with
            plain CSS3
          </li>
          <li>
            <b>Present</b>
            - Svelte, now with CSS Variables and CSS Grid layout
          </li>
        </ul>

        <p>
          Keeping things simple is hard, especially when you are equipped with
          more knowledge. When I look back at the old code that I wrote years
          ago, I tend to ponder -
          <i>was I the one who wrote this?</i>
          Then I will look at my current code and rewrite it to be simpler.
          Somehow I just need to remind myself not to complicate things
          <i>just because you can</i>
          .
        </p>

        <h4>Design Principles</h4>

        <p>
          I have learn and adopted several design principles when designing this
          site. This includes:
        </p>
        <ul>
          <li>limiting color choices to just red, white and shades of black</li>
          <li>structuring components using <b>Atomic Design Pattern</b></li>
          <li>
            using
            <b>Block Elements Modifier (BEM)</b>
            naming methodology (before CSS are scoped, this is the convention I
            used to avoid clashing class names)
          </li>
          <li>
            mixing two different fonts a.k.a
            <i>font pairing</i>
            to make the title stands out from the content
          </li>
          <li>
            applying
            <b>Modular Scale</b>
            (perfect fourth: 4 / 3) and
            <b>Vertical Rhythm</b>
            to improve readability of the site
          </li>
        </ul>
        <p>
          I think applying patterns, and being aware of the philosophy behind
          each decision makes a difference in the end result. See the difference
          in one of the page below by clicking on it.
        </p>
        <p>Before:</p>
        <a
          href="/assets/img/project/old-website.png"
          target="_blank"
          rel="noopener noreferrer">
          <img
            src="/assets/img/project/old-website.png"
            width="100%"
            height="auto" />
        </a>
        <p>After:</p>

        <a
          href="/assets/img/project/new-website.png"
          target="_blank"
          rel="noopener noreferrer">
          <img
            src="/assets/img/project/new-website.png"
            width="100%"
            height="auto" />
        </a>

        <p>It keeps getting better and better. 😄</p>
      </Modal>
    {/if}
  </div>
</div>
