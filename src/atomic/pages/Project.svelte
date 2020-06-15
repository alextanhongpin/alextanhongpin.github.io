<script>
  import Modal from '../atoms/Modal.svelte'

  let showModal = false
</script>

<style>
  .blocks {
    display: grid;
    grid-template-columns: 1fr;
    grid-column-gap: 1rem;
    grid-row-gap: 1rem;
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

    <div class="blocks">
      <div class="block">
        <h2>My Personal Website</h2>
        <i>Last updated: 19 May 2020</i>
        <br />

        <p>You are looking at it now! 😃</p>
        <p>Why my first website is also my favorite - because it is simple.</p>

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
          <li>
            structuring components using
            <b>Atomic Design Pattern</b>
          </li>
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

      </div>

      <div class="block">
        <h2>Finanz</h2>
        <i>Last updated: 15 June 2020</i>
        <br />

        <p>
          Your Personal Finance Manager.
          <a
            href="https://finanz-95e6d.web.app/"
            target="_blank"
            rel="noreferrer noopener">
            Link here
          </a>
        </p>
        <p>An application to manage and visualize your expenses.</p>

        <a
          href="/assets/img/project/finanz.png"
          target="_blank"
          rel="noreferrer noopener">
          <img
            src="/assets/img/project/finanz.png"
            width="100%"
            height="auto" />
        </a>

        <p>
          Finanz is an application that I wrote for myself to manage my
          expenses. While most people normally experiment different frontend
          frameworks with a TODO app, I do it with Finanz. If you visited my
          <a
            href="https://www.behance.net/alextan220e3ae"
            target="_blank"
            reol="noreferrer noopener">
            Behance
          </a>
          website, you might have seen different iterations on this app - in
          fact, it is something I have been working progressively on.
        </p>
        I have rewritten this app with different tech stacks:
        <ul>
          <li>
            <b>Frameworks:</b>
            from jQuery to Backbone, to React, Vue and back to React (with React
            Hooks and styled components)
          </li>
          <li>
            <b>Platform:</b>
            Google Chrome Extension, Electron, Web App (present), React Native
            (not pursued)
          </li>
          <li>
            <b>Storage:</b>
            From nedb, indexedDB (attempted to do offline storage, but couldn't
            get it to sync when online), Firebase (present)
          </li>
        </ul>

        <p>
          Though the frameworks changed (mainly due to code structure, such as
          when React Hooks are introduced etc), the business logic is plain
          simple - aggregate transactions and present it to the user, whether it
          is daily, weekly, monthly, yearly or total balance.
        </p>

        <p>
          The attempts with various frameworks also taught me their limitation.
          For example, the present stack is using Firebase Realtime Database as
          the storage (cause I did not want to pay for storage, and since I am
          the only user, I can go lean). Yeah, I know there's FireStore now, but
          the point is using Firebase is not the most ideal choice for several
          reasons - the primary being the business logic is handled on the
          client side. Business logics should ideally be handled on the server.
          Also, to aggregate the total balance, all the data has to be fetched
          from the Firebase storage to be computed on the client side.
          Snapshotting data might work, but comes at the risk of data
          inconsistency (transactions in Firebase only works for FireStore at
          the present, if I am not wrong).
        </p>

        <p>
          In terms of presentation, the UI definitely has changed a lot too. The
          very first version only has two screens (and it is a Chrome
          Extension).
        </p>

        <a
          href="/assets/img/project/finanz_alt_home.png"
          target="_blank"
          rel="noreferrer noopener">
          <img
            src="/assets/img/project/finanz_alt_home.png"
            width="100%"
            height="auto" />
        </a>

        <a
          href="/assets/img/project/finanz_alt_create.png"
          target="_blank"
          rel="noreferrer noopener">
          <img
            src="/assets/img/project/finanz_alt_create.png"
            width="100%"
            height="auto" />
        </a>

        <p>😊 I probably will rewrite it again in the near future.</p>
      </div>

      <div class="block">
        <h2>Github Recommender</h2>
        <i>Last updated: 16 June 2020</i>

        <p>
          This is an interesting one. After working on the expense tracker, I
          wanted to deal with more data-driven stuff. So I scraped GitHub's data
          (calling API is not technically scraping, but I just want to sound
          cool).
        </p>
        Yes, again, I have worked on different iterations on this app. The
        present version is v3 for the frontend.
        <ul>
          <li>
            <b>Backend:</b>
            initial version uses
            <a
              href="https://github.com/alextanhongpin/github-scraper"
              target="_blank"
              rel="noopener noreferrer">
              NodeJS + TypeScript
            </a>
            but then switched to using
            <a
              href="https://github.com/alextanhongpin/go-github-scraper"
              target="_blank"
              rel="noopener noreferrer">
              golang
            </a>
            , dockerized. The latest go code is in a separate private repo.
          </li>
          <li>
            <b>Frontend:</b>
            <a
              href="https://github.com/alextanhongpin/reason-github-leaderboard"
              target="_blank"
              rel="noreferrer noopener">
              ReasonML
            </a>
            😂, now using
            <a
              href="https://github.com/alextanhongpin/go-github-scraper-sg-ui"
              target="_blank"
              rel="noreferrer noopener">
              Vue Class Decorator + TypeScript
            </a>
          </li>
          <li>
            <b>Recommendation:</b>
            using TF-IDF algorithm written in golang, and also Trie Search
          </li>
        </ul>

        <p>
          There are several interesting domain here, mainly the
          <i>scraping</i>
          and
          <i>matching</i>
          part.
        </p>

        <h4>Scraping</h4>
        <p>
          Scraping is easy, if you only need to get the data once. There were
          two problems that I had to deal with - stale data and GitHub's rate
          limiting. In order to keep the data up to date, I have to periodically
          fetch new data for new users that are created in Malaysia and
          Singapore. This is done by keeping track of the last created user, and
          using the timestamp as a cursor to fetch newer users that are created
          after that period.
        </p>
        <p>
          For each user, I need to fetch only repositories that are updated
          since the date their data has been last scraped. Using the
          <b>delta timestamp</b>
          , we can minimize the fetching and avoid unnecessary calls. I wanted
          to add an additional logic to prioritize active users (those with
          repositories, and are still updating them), though I still didn't find
          the time to do so.
        </p>
        <p>
          To prevent the api from being rate limited, I had to add a throttle on
          the api calls, pause when the rate limits has been exceeded, and
          resume scraping. Note that due to this limitation, I only allow GitHub
          user's from Malaysia and Singapore to be scraped.
        </p>
        <p>
          The scraper runs periodically every day to fetch new users that are
          created the day before, and every minutes to fetch the user's
          repositories. I can only conclude that
          <i>building a resilient scraper is not easy.</i>
        </p>

        <h4>Matching</h4>
        <p>
          Matching GitHub user's is probably one of the more exciting feature.
          Initially, I created this in order to find users similar to my
          profile, based on the types of programming languages used, the
          repository's name, description and tags, as well as workplace.
        </p>
        <p>
          Since it is a project, I wanted to avoid using library (and end up
          writing some 😊).
        </p>

        <ul>
          <li>
            <a
              href="https://github.com/alextanhongpin/autocomplete"
              target="_blank"
              rel="noopener noreferrer">
              alextanhongpin/autocomplete
            </a>
            : An auto-complete and auto-correct server. Auto-complete feature
            using
            <b>Trie</b>
            and auto-corect using
            <b>BK-Tree</b>
            which uses Damerau-levenshtein as the distance metric
          </li>
          <li>
            <a
              href="https://github.com/alextanhongpin/typeahead"
              target="_blank"
              rel="noopener noreferrer">
              alextanhongpin/typeahead
            </a>
            : Auto-complete implementation using
            <b>Trie</b>
          </li>
          <li>
            <a
              href="https://github.com/alextanhongpin/stringdist"
              target="_blank"
              rel="noopener noreferrer">
              alextanhongpin/stringdist
            </a>
            : Various string distance implementation in golang, used in the
            autocomplete server
          </li>
        </ul>

        <p>
          The algorithm used for the GitHub recommender is
          <b>TF-IDF</b>
          , which stands for
          <i>term frequency, inverse document frequency</i>
          . I got interested in string algorithms after reading about Natural
          Language Processing and Text Mining. While the results are relevant
          (at least to me), I find that it can never be perfect, due to the fact
          it relies heavily on information that is scraped from GitHub.
        </p>

        <p>
          Aside from the accuracy of the matching algorithm, another issue that
          I faced initially was how expensive it was to perform the matching. At
          one point, the server just crashes due to the intensive calculation
          and sorting (sorting causes the CPU to shoot up to 100% in my cheap
          linode instance running Docker). Loading everything into memory wasn't
          the smartest choice either, as I soon face out of memory (OOM) issue
          for the application which causes constant crash. After several
          attempts at profiling (another reason to choose Golang over Node,
          because the profiling tool was much more mature at that time and
          allows me to find the bottleneck in the application), I manage to
          optimize the algorithm used, and also rewritten it to work in batches
          instead of loading everything into memory.
        </p>

        <p>
          😊 After everything works, I just ditched this project and continue
          working on other things. You can see the screenshot of the application
          below (it is no longer hosted, but a picture paints a thousand words).
        </p>

        <a
          href="/assets/img/project/github_recommender_v3.png"
          target="_blank"
          rel="noreferrer noopener">
          <img
            src="/assets/img/project/github_recommender_v3.png"
            width="100%"
            height="auto" />
        </a>
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
          <li>
            structuring components using
            <b>Atomic Design Pattern</b>
          </li>
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
