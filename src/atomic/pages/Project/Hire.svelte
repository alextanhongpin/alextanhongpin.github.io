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
  <h2 id="hire">HIRE | Paperless Applicant Tracking System</h2>
  <i>Last updated: 19 November 2020</i>
  <br />

  <a
    href="/assets/img/project/hire_people.png"
    target="_blank"
    rel="noreferrer noopener">
    <figure>
      <img
        src="/assets/img/project/hire_people.png"
        width="100%"
        height="auto"
        alt="HIRE - People Page" />
      <figcaption>Figure 1. HIRE - People Page</figcaption>
    </figure>
  </a>

  <a
    href="/assets/img/project/hire_company.png"
    target="_blank"
    rel="noreferrer noopener">
    <figure>
      <img
        src="/assets/img/project/hire_company.png"
        width="100%"
        height="auto"
        alt="HIRE - Company Page" />
      <figcaption>Figure 2. HIRE - Company Page</figcaption>
    </figure>
  </a>

  <a
    href="/assets/img/project/hire_job.png"
    target="_blank"
    rel="noreferrer noopener">
    <figure>
      <img
        src="/assets/img/project/hire_job.png"
        width="100%"
        height="auto"
        alt="HIRE - Job Page" />
      <figcaption>Figure 3. HIRE - Job Page</figcaption>
    </figure>
  </a>

  <p>
    HIRE serves the needs of three different target audience - recruiters, job
    seekers and companies. HIRE attempts to close the gap between by covering
    their different needs.
  </p>

  <p>
    Recruiters wants a better way to manage the candidate - from having a place
    to store their contact details as well as documents, and keeping track of
    the application status. Recruiters can also add notes for the different
    hiring stages, keeping it transparent to other collaborators. This helps to
    minimize duplicate work as well as leaving a digital footprint of the hiring
    decisions for future reference.
  </p>

  <p>
    Job seekers wants to keep track of their current job application, as well as
    being notified whenever there are changes in their application status. Even
    if their application is rejected, job seekers wants confirmation in order to
    move on.
  </p>
  <p>
    Companies wants a space where they can work closely with recruiters and view
    their hiring metrics.
  </p>
  <p>
    HIRE is a mesh of features that covers all their needs. The technology stack
    is as follow:
  </p>
  <ul>
    <li>
      <b>Tech Stack:</b>
      TypeScript GraphQL + DataLoader (Backend), TypeScript React + Storybook
      (Frontend)
    </li>
    <li><b>Platform:</b> Web</li>
    <li><b>Storage:</b> Postgres</li>
  </ul>

  <p>
    The backend is designed as a monolith, but with clear separation between
    services. Each services are a single folder, so it can be broken into
    microservices when needed. However, structuring it as a monolith was a clear
    choice for the following reasons:
  </p>
  <ol>
    <li>
      The boundaries has not been clearly defined in the beginning. It only
      starts to be more clear after several iteration.
    </li>
    <li>It is easier to work with database transactions in a monolith.</li>
    <li>
      Cross-cutting concerns such as authorization, logging, dataloaders can be
      shared more easily.
    </li>
  </ol>

  <p>
    The code is well architectured, and is production ready. Unit and
    integration tests are also written to cover the basic cases. I rarely do TDD
    (test-driven-development), but rather TAD (test-after-development). Having a
    coverage of more than 80% is usually sufficient for me, with more focus on
    the code that produces side-effects (a.k.a. write operations). The
    integration tests also covers running reads and writes against the database
    that is spun up through docker compose - something I see as essential since
    a lot of silly mistakes usually happens at that layer that is undetected
    should one just mock the layer.
  </p>

  <p>
    Another interesting aspect of this project is
    <b>code generation</b>. Most of the
    <a
      href="https://en.wikipedia.org/wiki/Create,_read,_update_and_delete#:~:text=In%20computer%20programming%2C%20create%2C%20read,or%20destroy%20instead%20of%20delete."
      target="_blank">CRUD</a>
    operations are generated from templates, including the unit and integration
    tests. The only changes that are manual is the mapping to the database
    columns, and custom business logic. Sofware writing sofware.
  </p>
</div>
