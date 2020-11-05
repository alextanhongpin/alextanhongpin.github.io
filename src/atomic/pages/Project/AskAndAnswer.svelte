<script>
</script>

<div class="block">
  <h2 id="ask-and-answer">Ask & Answer</h2>
  <i>Last updated: 5 November 2020</i>
  <br />

  <a
    href="/assets/img/project/finanz.png"
    target="_blank"
    rel="noreferrer noopener">
    <img
      src="/assets/img/project/ask_and_answer.png"
      width="100%"
      height="auto"
      alt="Ask & Answer" />
  </a>

  <p>
    You might have asked yourself once (and now twice) - how hard is it to build
    a social media website like Facebook? Someone else might be asking themself
    a similar question - how to build Quora?
  </p>
  <p>Let me tell you something, there are no such thing as dumb questions.</p>
  <p>It's hard. Period.</p>
  <p>
    I have always been intrigued on how to create an application like Quora or
    Facebook. Ask & Answer is a hybrid of both. I wanted to recreate the bare
    minimum of it with the least resources. So here's the tech stack for it:
  </p>
  <ul>
    <li>
      <b>Tech Stack:</b>
      Golang GraphQL (Backend), React + Apollo Client v3 + Storybook (Frontend)
    </li>
    <li><b>Platform:</b> Web</li>
    <li><b>Storage:</b> Postgres (with a nicely done database design)</li>
  </ul>
  <p>
    Users can ask questions, comment, post answers, leave reactions as well as
    connect with other users by sending friend requests. Designing the backend
    is indeed a challenge, and I took a lot of consideration when designing the
    database schema using Postgres, a
    <b>Relational Database Management System (RDMS)</b>. Given the nature of the
    application, a graph database would have been an interesting choice. But
    since Postgres (or MySQL) is more readily available, I decided to go with
    it.
  </p>
  <p>
    Both backend and frontend has undergo several revision, just to get the
    structure right. Since it is possible to traverse infinitely when using
    GraphQL (question has answer, answer belongs to question), I had to be
    careful to avoid circular dependency when writing in golang.
  </p>
  <p>
    It is currently still work in progress, and I have barely scratched the
    surface.
  </p>
</div>
