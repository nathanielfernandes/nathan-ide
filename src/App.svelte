<script lang="ts">
  import "./app.css";
  import Editor from "./lib/Editor.svelte";
</script>

<svelte:head>
  <script
    src="https://kit.fontawesome.com/10e77f81a6.js"
    crossorigin="anonymous"
  ></script>
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/gh/devicons/devicon@v2.15.1/devicon.min.css"
  />
</svelte:head>

<main class="overflow-x-hidden">
  <Editor></Editor>
</main>

<style>
</style>
