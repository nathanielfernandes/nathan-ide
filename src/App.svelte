<script>
  import Editor from "./components/Editor.svelte";
  import { onMount } from "svelte";
  import { visit } from "./components/stores.js";
  import { fly } from "svelte/transition";

  let isnew = false;

  onMount(() => {
    isnew = true;
  });
</script>

<main>
  <!-- <h1>Hello</h1> -->
  <!-- <div class="header">Common Lisp Editor</div> -->
  {#if $visit && isnew}
    <div transition:fly={{ y: 200, duration: 1000 }} class="first-visit">
      <h1 class="first-header">👋 hey there,</h1>
      <p>
        This website aims to be an online <a
          class="link"
          href="https://common-lisp.net/">Common Lisp</a
        >
        IDE.
        <br />
        <br />
        It was built using <a class="link" href="https://svelte.dev/">Svelte</a>
        and uses an instance of
        <a class="link" href="https://github.com/engineer-man/piston">Piston</a>
        to execute your code. It is a completely static website and collects no information
        or code you run.
        <br />
        <br />
        The code you write will be saved on your browsers local storage for the current
        session, in case you accidentally close or leave the page. (closing your
        browser or turning off your computer will erase any saved code!)
        <br />
        <br />
        I made this IDE for fun and because of the difficult setup process for lisp
        on different OS's. Although it is much easier to use this IDE, you will be
        missing out on the many features emacs provides.
        <br />
        <br />
        <b>Disclaimer</b>
        <br />
        There can always be discrepancies between running your code here and elsewhere.
        <b>Use at your own risk!</b>
        <br />
        <br />
        This IDE is not perfect by any means and if you are using it to complete
        assignments or write important code, I am not responsible for any of the
        code produced using this IDE.
        <br />
        <br />
        Other than that I hope this IDE helps you strengthen your lisp!
        <br />
        <br />
        If you have any questions/concerns you can message me on discord at
        <b>nathan#3724</b>
        <br />
        <br />
      </p>

      <button
        class="understand"
        on:click={() => {
          isnew = false;
        }}
      >
        <i class="fas fa-scroll" /> I Understand
      </button>
    </div>
  {/if}
  <Editor />
  <div class="footer">
    <p class="love">
      Made with love by <a
        class="link"
        href="https://github.com/nathanielfernandes">Nathaniel Fernandes</a
      >
      &mdash; fork or suggest edits on
      <a class="link" href="https://github.com/nathanielfernandes">GitHub</a>
    </p>
  </div>
</main>

<svelte:head>
  <link
    rel="stylesheet"
    href="https://use.fontawesome.com/releases/v5.15.3/css/all.css"
  />
</svelte:head>

<style>
  main {
    padding: 0;
    margin: 0;
  }

  .first-visit {
    position: fixed;
    position: fixed;
    width: 550px;
    height: 600px;
    top: 50%;
    left: 50%;
    margin-top: -350px; /* Negative half of height. */
    margin-left: -275px; /* Negative half of width. */
    border-radius: 4px;
    background-color: rgb(233, 233, 233);
    box-shadow: 2px 2px 8px 8px rgba(0, 0, 0, 0.197);
    padding: 1rem;
    z-index: 10;
  }

  .first-header {
    padding: 0;
    margin: 0;
  }

  .understand {
    color: white;
    background-color: rgb(0, 187, 255);
    outline: none;
    border: none;
    border-radius: 4px;
    margin-right: 0.5rem;
    position: absolute;
    right: 0;
    bottom: 0;
    transition: all 100ms;
  }

  .understand:hover {
    background-color: rgb(60, 203, 255);
  }

  .understand:active {
    background-color: rgb(116, 218, 255);
  }

  /* .header {
    color: rgb(93, 93, 93);
    justify-content: center;
    display: flex;
    align-items: center;
    text-align: center;
    padding: 0.2rem;
  } */

  .footer {
    justify-content: center;
    display: flex;
    align-items: center;

    text-align: center;
  }

  .love {
    margin: 0.4rem;
    color: #5b5b5b;
  }

  .link {
    text-decoration: none;
    transition: all 100ms;
  }

  .link:hover {
    color: rgb(0, 162, 255);
  }
  /* main {
    text-align: center;
    padding: 0;
    margin: 0;

    max-width: 240px;
    margin: 0 auto;
  } */

  /* h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 2rem;
    font-weight: 100;
    padding: 0;
    margin: 0;
  } */

  /* @media (min-width: 640px) {
    main {
      max-width: none;
    }
  } */
</style>
