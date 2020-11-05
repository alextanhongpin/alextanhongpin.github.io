<script>
</script>

<div class="block">
  <h2 id="finanz">Finanz | Visualize Your Expenses</h2>
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
    <img src="/assets/img/project/finanz.png" width="100%" height="auto" alt='Finanz'/>
  </a>
  <p>
    Finanz is an application that I wrote for myself to manage my expenses.
    While most people normally experiment different frontend frameworks with a
    TODO app, I do it with Finanz. If you visited my
    <a
      href="https://www.behance.net/alextan220e3ae"
      target="_blank"
      reol="noreferrer noopener">
      Behance
    </a>
    website, you might have seen different iterations on this app - in fact, it
    is something I have been working progressively on.
  </p>
  I have rewritten this app with different tech stacks:
  <ul>
    <li>
      <b>Frameworks:</b>
      from jQuery to Backbone, to React, Vue and back to React (with React Hooks
      and styled components)
    </li>
    <li>
      <b>Platform:</b>
      Google Chrome Extension, Electron, Web App (present), React Native (not
      pursued)
    </li>
    <li>
      <b>Storage:</b>
      From nedb, indexedDB (attempted to do offline storage, but couldn't get it
      to sync when online), Firebase (present)
    </li>
  </ul>
  <p>
    Though the frameworks changed (mainly due to code structure, such as when
    React Hooks are introduced etc), the business logic is plain simple -
    aggregate transactions and present it to the user, whether it is daily,
    weekly, monthly, yearly or total balance.
  </p>
  <p>
    The attempts with various frameworks also taught me their limitation. For
    example, the present stack is using Firebase Realtime Database as the
    storage (cause I did not want to pay for storage, and since I am the only
    user, I can go lean). Yeah, I know there's FireStore now, but the point is
    using Firebase is not the most ideal choice for several reasons - the
    primary being the business logic is handled on the client side. Business
    logics should ideally be handled on the server. Also, to aggregate the total
    balance, all the data has to be fetched from the Firebase storage to be
    computed on the client side. Snapshotting data might work, but comes at the
    risk of data inconsistency (transactions in Firebase only works for
    FireStore at the present, if I am not wrong).
  </p>
  <p>
    In terms of presentation, the UI definitely has changed a lot too. The very
    first version only has two screens (and it is a Chrome Extension).
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
