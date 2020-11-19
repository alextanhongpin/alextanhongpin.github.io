<script>
  import Finanz from './Project/Finanz.svelte'
  import GithubRecommender from './Project/GithubRecommender.svelte'
  import PersonalWebsite from './Project/PersonalWebsite.svelte'
  import Hire from './Project/Hire.svelte'
  import AskAndAnswer from './Project/AskAndAnswer.svelte'
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
        <li><a href="#ask-and-answer">Ask & Answer</a></li>
        <li><a href="#hire">Hire | Paperless Applicant Tracking System</a></li>
        <li><a href="#github-recommender">Github Recommender</a></li>
        <li><a href="#finanz">Finanz | Visualize Your Expenses</a></li>
        <li><a href="#my-personal-website">My Personal Website</a></li>
      </ul>
    </div>
    <div class="blocks">
      <div class="block">
        <AskAndAnswer />
      </div>
      <div class="block">
        <Hire />
      </div>
      <div class="block">
        <GithubRecommender />
      </div>
      <div class="block">
        <Finanz />
      </div>
      <div class="block">
        <PersonalWebsite />
      </div>
    </div>
  </div>
</div>
