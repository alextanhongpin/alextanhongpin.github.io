<script>
</script>

<div class='block'>
  <h2 id='github-recommender'>Github Recommender</h2>
  <i>Last updated: 16 June 2020</i>
  <p>
    This is an interesting one. After working on the expense tracker, I wanted
    to deal with more data-driven stuff. So I scraped GitHub's data (calling API
    is not technically scraping, but I just want to sound cool).
  </p>
  Yes, again, I have worked on different iterations on this app. The present
  version is v3 for the frontend.
  <ul>
    <li>
      <b>Backend:</b>
      initial version uses
      <a
        href='https://github.com/alextanhongpin/github-scraper'
        target='_blank'
        rel='noopener noreferrer'
      >
        NodeJS + TypeScript
      </a>
      but then switched to using
      <a
        href='https://github.com/alextanhongpin/go-github-scraper'
        target='_blank'
        rel='noopener noreferrer'
      >
        golang
      </a>
      , dockerized. The latest go code is in a separate private repo.
    </li>
    <li>
      <b>Frontend:</b>
      <a
        href='https://github.com/alextanhongpin/reason-github-leaderboard'
        target='_blank'
        rel='noreferrer noopener'
      >
        ReasonML
      </a>
      😂, now using
      <a
        href='https://github.com/alextanhongpin/go-github-scraper-sg-ui'
        target='_blank'
        rel='noreferrer noopener'
      >
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
    Scraping is easy, if you only need to get the data once. There were two
    problems that I had to deal with - stale data and GitHub's rate limiting. In
    order to keep the data up to date, I have to periodically fetch new data for
    new users that are created in Malaysia and Singapore. This is done by
    keeping track of the last created user, and using the timestamp as a cursor
    to fetch newer users that are created after that period.
  </p>
  <p>
    For each user, I need to fetch only repositories that are updated since the
    date their data has been last scraped. Using the
    <b>delta timestamp</b>, we can minimize the fetching and avoid unnecessary
    calls. I wanted to add an additional logic to prioritize active users (those
    with repositories, and are still updating them), though I still didn't find
    the time to do so.
  </p>
  <p>
    To prevent the api from being rate limited, I had to add a throttle on the
    api calls, pause when the rate limits has been exceeded, and resume
    scraping. Note that due to this limitation, I only allow GitHub user's from
    Malaysia and Singapore to be scraped.
  </p>
  <p>
    The scraper runs periodically every day to fetch new users that are created
    the day before, and every minutes to fetch the user's repositories. I can
    only conclude that
    <i>building a resilient scraper is not easy.</i>
  </p>
  <h4>Matching</h4>
  <p>
    Matching GitHub user's is probably one of the more exciting feature.
    Initially, I created this in order to find users similar to my profile,
    based on the types of programming languages used, the repository's name,
    description and tags, as well as workplace.
  </p>
  <p>
    Since it is a project, I wanted to avoid using library (and end up writing
    some 😊).
  </p>
  <ul>
    <li>
      <a
        href='https://github.com/alextanhongpin/autocomplete'
        target='_blank'
        rel='noopener noreferrer'
      >
        alextanhongpin/autocomplete
      </a>
      : An auto-complete and auto-correct server. Auto-complete feature using
      <b>Trie</b>
      and auto-corect using
      <b>BK-Tree</b>
      which uses Damerau-levenshtein as the distance metric
    </li>
    <li>
      <a
        href='https://github.com/alextanhongpin/typeahead'
        target='_blank'
        rel='noopener noreferrer'
      >
        alextanhongpin/typeahead
      </a>
      : Auto-complete implementation using
      <b>Trie</b>
    </li>
    <li>
      <a
        href='https://github.com/alextanhongpin/stringdist'
        target='_blank'
        rel='noopener noreferrer'
      >
        alextanhongpin/stringdist
      </a>
      : Various string distance implementation in golang, used in the
      autocomplete server
    </li>
  </ul>
  <p>
    The algorithm used for the GitHub recommender is
    <b>TF-IDF</b>, which stands for
    <i>term frequency, inverse document frequency</i>. I got interested in
    string algorithms after reading about Natural Language Processing and Text
    Mining. While the results are relevant (at least to me), I find that it can
    never be perfect, due to the fact it relies heavily on information that is
    scraped from GitHub.
  </p>
  <p>
    Aside from the accuracy of the matching algorithm, another issue that I
    faced initially was how expensive it was to perform the matching. At one
    point, the server just crashes due to the intensive calculation and sorting
    (sorting causes the CPU to shoot up to 100% in my cheap linode instance
    running Docker). Loading everything into memory wasn't the smartest choice
    either, as I soon face out of memory (OOM) issue for the application which
    causes constant crash. After several attempts at profiling (another reason
    to choose Golang over Node, because the profiling tool was much more mature
    at that time and allows me to find the bottleneck in the application), I
    manage to optimize the algorithm used, and also rewritten it to work in
    batches instead of loading everything into memory.
  </p>
  <p>
    😊 After everything works, I just ditched this project and continue working
    on other things. You can see the screenshot of the application below (it is
    no longer hosted, but a picture paints a thousand words).
  </p>
  <a
    href='/assets/img/project/github_recommender_v3.png'
    target='_blank'
    rel='noreferrer noopener'
    alt='Github Recommender'
  >
    <img
      src='/assets/img/project/github_recommender_v3.png'
      width='100%'
      height='auto'
    alt='Github Recommender'
    />
  </a>
</div>
