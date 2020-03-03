<script>
  import state from '../../store/book'
  const { books } = state
</script>

<style>
  .book-holder {
    text-align: center;
  }

  .book {
    display: inline-block;
    margin: 0 var(--h5) var(--base-line-height);
    font-weight: 500;
  }

  .book i {
    font-weight: 400;
    font-size: var(--h6);
  }
</style>

<div class="body">
  <div class="body-column">
    <h1 class="h1">Books I read</h1>
    <br />

    <div class="quote">
      you can't buy happiness but you can buy books ... and that's kind of the
      same thing
    </div>
    <br />

    <div class="book-holder">
      {#each books as book (book.title)}
        <div class="book">
          {book.title} -
          <i>{book.author}</i>
        </div>
      {/each}
    </div>
    <br />
  </div>
</div>
