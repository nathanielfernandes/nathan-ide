<script>
  import { createEventDispatcher } from "svelte";
  import { theme, accent, accentColors } from "./stores.js";
  const dispatch = createEventDispatcher();

  export let filename;
  export let session;
  export let editor;

  export let focused;

  const undo_manager = new ace.UndoManager();

  let tab;
  if (focused) {
    focus();
  }

  function focus() {
    // console.log(`focused ${filename}`);
    dispatch("focused", { filename });
    editor.setSession(session);
    session.setUndoManager(undo_manager);

    if (tab !== undefined) {
      tab.scrollIntoView({ behavior: "smooth" });
    }
  }

  function trash() {
    // console.log("trashed");
    dispatch("trashed", { filename });
  }

  function change_name() {
    if (filename !== undefined && filename.length > 0) {
      //   console.log("change name");
      dispatch("namechange", { filename });
    }
  }
</script>

<div
  bind:this={tab}
  class={`ace-${$theme} ${focused ? "focused" : ""}`}
  style={focused ? `background-color: ${$accentColors[$accent]}` : ""}
  on:click={focus}
>
  <i class="fas fa-file-code" on:click={focus} />
  <!-- <div class="air" on:click={focus} /> -->
  <input
    size={filename.length}
    disabled={!focused}
    class={`tabname ${focused ? "" : "notfocused"}`}
    bind:value={filename}
    on:change={change_name}
  />

  {#if focused}
    <i on:click={trash} class="fas fa-times" />
  {/if}
</div>

<style>
  .fa-file-code {
    font-size: 1rem;
    margin-right: 0.5rem;
    cursor: grab;
  }

  .fa-times {
    font-size: 1rem;
    transition: all 100ms;
  }

  .fa-times:hover {
    color: #fe4444;
    transform: scale(1.4);
  }

  div {
    justify-content: left;
    align-items: center;
    display: flex;
    cursor: pointer;
    /* background-color: rgb(47, 47, 47);
    color: white; */
    /* margin: 0 0rem 0 0; */
    padding: 0.5rem 1rem;
    /* border-radius: 5px 5px 0px 0px; */
    transition: all 100ms;
    /* width: 160px; */
    /* max-width: 160px; */
  }

  div:hover {
    filter: brightness(110%);
  }

  div:active {
    filter: brightness(150%);
  }

  .focused {
    /* filter: brightness(150%); */
    /* background-color: #36f669; */
    color: rgb(42, 42, 42);
    /* box-shadow: 0px 13px 0px 0px  */
  }

  .notfocused {
    cursor: pointer;
  }

  .tabname {
    width: 10px;
    /* cursor: pointer; */
    margin: 0 1rem 0 0;
    /* padding: 0 0 0 0; */
    color: inherit;
    border: none;
    background-color: inherit;
    width: inherit;
  }
</style>
