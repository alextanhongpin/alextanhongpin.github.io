<script>
</script>

<style>
  figure {
    margin: 0 0 4rem 0;
    text-align: center;
  }
  figure img {
    border: 1px solid #eee;
    border-radius: 5px;
    overflow: hidden;
  }
</style>

<div class="block">
  <h2 id="ask-and-answer">Ask & Answer</h2>
  <i>Last updated: 19 November 2020</i>
  <br />

  <a
    href="/assets/img/project/ask_and_answer_old.png"
    target="_blank"
    rel="noreferrer noopener">
    <figure>
      <img
        src="/assets/img/project/ask_and_answer_old.png"
        width="100%"
        height="auto"
        alt="Ask & Answer (old)" />
      <figcaption>Figure 1. First version of the Home Page</figcaption>
    </figure>
  </a>

  <a
    href="/assets/img/project/ask_and_answer_home.png"
    target="_blank"
    rel="noreferrer noopener">
    <figure>
      <img
        src="/assets/img/project/ask_and_answer_home.png"
        width="100%"
        height="auto"
        alt="Ask & Answer - Home Page" />
      <figcaption>Figure 2. Redesign of the Home Page</figcaption>
    </figure>
  </a>

  <a
    href="/assets/img/project/ask_and_answer_profile_detail.png"
    target="_blank"
    rel="noreferrer noopener">
    <figure>
      <img
        src="/assets/img/project/ask_and_answer_profile_detail.png"
        width="100%"
        height="auto"
        alt="Ask & Answer - Profile Detail Page" />
      <figcaption>Figure 3. Profile Detail Page</figcaption>
    </figure>
  </a>

  <a
    href="/assets/img/project/ask_and_answer_topic_detail.png"
    target="_blank"
    rel="noreferrer noopener">
    <figure>
      <img
        src="/assets/img/project/ask_and_answer_topic_detail.png"
        width="100%"
        height="auto"
        alt="Ask & Answer - Topic Detail Page" />
      <figcaption>Figure 4. Topic Detail Page</figcaption>
    </figure>
  </a>

  <a
    href="/assets/img/project/ask_and_answer_question_detail.png"
    target="_blank"
    rel="noreferrer noopener">
    <figure>
      <img
        src="/assets/img/project/ask_and_answer_question_detail.png"
        width="100%"
        height="auto"
        alt="Ask & Answer - Question Detail Page" />
      <figcaption>
        Figure 5. Question Detail Page, highlighting the answer question feature
      </figcaption>
    </figure>
  </a>

  <a
    href="/assets/img/project/ask_and_answer_question_detail_comment.png"
    target="_blank"
    rel="noreferrer noopener">
    <figure>
      <img
        src="/assets/img/project/ask_and_answer_question_detail_comment.png"
        width="100%"
        height="auto"
        alt="Ask & Answer - Question Detail Page Comment" />
      <figcaption>
        Figure 6. Question Detail Page, highlighting the comment and reaction
        feature
      </figcaption>
    </figure>
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
