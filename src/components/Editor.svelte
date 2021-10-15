<script>
  import {
    theme,
    fontsize,
    tabs,
    files,
    accent,
    accentColors,
  } from "./stores.js";
  import Tab from "./Tab.svelte";
  import Interpreter from "./Interpreter.svelte";
  import defaults from "./data/editor_defaults.json";
  import { fly } from "svelte/transition";
  import { onMount } from "svelte";

  import { debounce } from "./helpers.js";

  let fileinput;

  const onFileSelected = (e) => {
    Array.from(e.target.files).forEach((f) => {
      let reader = new FileReader();
      reader.readAsText(f);
      reader.onload = (e) => {
        let file = e.target.result;
        named_tab(f.name, file);
      };
      fileinput.value = "";
    });
    // let f = e.target.files[0];
  };

  let editor;
  let saved = false;

  let session_theme = $theme;
  let session_fontsize = Number($fontsize);

  function updateTheme() {
    theme.set(session_theme);
    editor.setTheme(`ace/theme/${$theme}`);
  }

  function updateFontSize() {
    fontsize.set(session_fontsize);
    editor.setFontSize($fontsize);
  }

  $: theme_class = `ace-${$theme.replace("_", "-")}`;

  let endTab;

  function named_tab(name, contents) {
    let session = new ace.EditSession(contents);

    let mode = aceModeList.getModeForPath(name);
    session.setMode(mode.mode);

    tabs.update((t) =>
      t.concat([
        {
          session: session,
          filename: name,
          focused: true,
        },
      ])
    );

    refocus({ detail: { filename: name } });
    fix_names();
    save();
  }

  function new_tab() {
    let fn = `newfile${$tabs.length + 1}`;

    let session = new ace.EditSession("");
    session.setMode("ace/mode/lisp");

    tabs.update((t) =>
      t.concat([
        {
          session: session,
          filename: fn,
          focused: true,
        },
      ])
    );

    fix_names();
    refocus({ detail: { filename: fn } });
    save();
  }

  function refocus(event) {
    const { filename } = event.detail;
    // console.log("refocus " + filename);

    tabs.set(
      $tabs.map((b) => {
        if (b.filename === filename) {
          b.focused = true;
        } else {
          b.focused = false;
        }
        return b;
      })
    );

    // endTab.scrollIntoView({ behavior: "smooth" });
  }

  function trash(event) {
    if ($tabs.length > 1) {
      const { filename } = event.detail;
      tabs.update((t) => t.filter((t) => t.filename !== filename));
      refocus({ detail: { filename: $tabs[$tabs.length - 1].filename } });
      toLocalStorage();
    }
  }

  function fix_names() {
    let checked = [];
    let i = 1;

    tabs.set(
      $tabs.map((t) => {
        if (checked.includes(t.filename)) {
          let [name, ext] = t.filename.split(".");
          t.filename = `${name}_${i}${ext === undefined ? "" : `.${ext}`}`;
          i++;
        }
        checked.push(t.filename);

        return t;
      })
    );
  }

  function update_name(event) {
    const { filename } = event.detail;

    tabs.set(
      $tabs.map((t) => {
        if (t.focused) {
          t.filename = filename;
          let mode = aceModeList.getModeForPath(t.filename);
          t.session.setMode(mode.mode);
        }
        return t;
      })
    );

    fix_names();
    save();
  }

  let aceModeList;
  function setup_ace() {
    aceModeList = ace.require("ace/ext/modelist");

    ace.config.set(
      "basePath",
      "https://cdn.jsdelivr.net/npm/ace-builds@1.4.3/src-noconflict/"
    );

    editor = ace.edit("editor");
    updateTheme();
    updateFontSize();
    editor.on("change", save);

    editor.setOptions({
      enableBasicAutocompletion: true,
      enableSnippets: true,
      enableLiveAutocompletion: true,
      highlightActiveLine: false,
    });

    $files.forEach((f) => {
      named_tab(f.filename, f.content);
    });
  }

  function toLocalStorage() {
    // console.log("saved");
    let temp_files = [];

    let fn;
    let focused_session;
    $tabs.forEach((t) => {
      if (t.focused) {
        focused_session = t.session;
        fn = t.filename;
      }
      editor.setSession(t.session);
      temp_files.push({ filename: t.filename, content: editor.getValue() });
    });
    editor.setSession(focused_session);
    files.set(temp_files);
    saved = true;
    return fn;
  }

  function saveStaticDataToFile() {
    let fn = toLocalStorage();
    var blob = new Blob([editor.getValue()], {
      type: "text/plain;charset=utf-8",
    });

    saveAs(blob, fn);
  }

  let keyCode;

  function handleKeydown(event) {
    if ((keyCode === 91 || keyCode === 17) && event.keyCode === 83) {
      event.preventDefault();
      saveStaticDataToFile();
    }

    keyCode = event.keyCode;
  }

  const deSave = debounce(toLocalStorage, 2000);
  const save = () => {
    saved = false;
    deSave();
  };

  let showInterp = false;
  onMount(() => {
    showInterp = true;
  });

  $: accent_color = $accentColors[$accent];

  let cycle_color = () => {
    if ($accent >= 6) {
      $accent = 0;
    } else {
      $accent++;
    }
  };
</script>

<main>
  <div class="both">
    <div class={`ace ${theme_class}`}>
      <div class="tabs">
        {#each $tabs as { filename, session, focused }}
          <Tab
            {filename}
            {session}
            {editor}
            {focused}
            on:focused={refocus}
            on:trashed={trash}
            on:namechange={update_name}
          />
        {/each}
        <div class="new_tab" on:click={new_tab}>
          <i class="fas fa-plus-square" />
        </div>
        <!-- class={"new_tab " + theme_class} -->

        <div
          bind:this={endTab}
          class="new_tab"
          on:click={() => {
            fileinput.click();
          }}
        >
          <i class="fas fa-file-upload" />
        </div>

        <input
          style="display:none"
          type="file"
          accept="*"
          on:change={(e) => onFileSelected(e)}
          bind:this={fileinput}
          multiple
        />
      </div>
      <div
        style={`height:3px; background-color:${accent_color}; transition: all 100ms`}
      />
      <div class="editor-container">
        <div id="editor" />
      </div>

      <div id="options" class={theme_class}>
        <i
          title="This is a save indicator that shows when your work is saved to the browser."
          class="fas fa-save"
          style={`color: ${saved ? "#36f669" : "#ffb406"};`}
          on:click={() => {
            toLocalStorage();
          }}
        />

        <i
          title="accent color"
          class="fas fa-palette"
          on:click={cycle_color}
          style="{`color:${accent_color}`};"
        />

        <label>
          Theme:
          <select
            class="option"
            bind:value={session_theme}
            on:change={updateTheme}
          >
            {#each defaults.all_themes as t}
              <option value={t}>
                {t}
              </option>
            {/each}
          </select>
        </label>

        <label
          >Font-size:
          <input
            class="option nn"
            type="number"
            bind:value={session_fontsize}
            on:change={updateFontSize}
          />
        </label>

        <div>
          Use <b>Ctrl/Cmd + S</b> to save files
        </div>

        <div class="love">
          Made with love by
          <a class="link" href="https://github.com/nathanielfernandes"
            >Nathaniel Fernandes</a
          >
          &mdash; fork or suggest edits on
          <a class="link" href="https://github.com/nathanielfernandes">GitHub</a
          >
        </div>
      </div>
    </div>

    <!-- class={`interpreter ${showInterp ? "" : "hide"}`} -->
    {#if showInterp}
      <div transition:fly={{ x: 500, duration: 500 }} class="interpreter">
        <Interpreter
          on:execute={() => {
            toLocalStorage();
          }}
        />
      </div>
    {/if}

    {#if !showInterp}
      <i
        class="fas fa-chevron-left sizer"
        on:click={() => {
          showInterp = !showInterp;
        }}
      />
    {:else}
      <i
        class="fas fa-chevron-right sizer"
        on:click={() => {
          showInterp = !showInterp;
        }}
      />
    {/if}
  </div>
</main>

<svelte:head>
  <script
    src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.0/FileSaver.js"></script>
  <script
    on:load={setup_ace}
    src="https://cdn.jsdelivr.net/combine/npm/ace-min-noconflict@1.1.9,npm/ace-min-noconflict@1.1.9/ext-language_tools.min.js,npm/ace-min-noconflict@1.1.9/ext-modelist.min.js,npm/ace-min-noconflict@1.1.9/mode-sh.min.js"></script>
</svelte:head>

<svelte:window on:keydown={handleKeydown} />

<style>
  main {
    /* text-align: center; */
    /* padding: 1em; */
    padding: 0;
    margin: 0;
    height: 100%;
    right: 1rem;

    /* margin: 0 auto; */
  }
  .fa-palette {
    font-size: 1.2rem;
    cursor: pointer;
  }

  .fa-palette:hover {
    transform: scale(1.3);
  }

  .fa-palette:active {
    transform: scale(1.2);
  }

  .fa-save {
    margin: 0 1rem;
    font-size: 1.4rem;
    cursor: pointer;
    transition: all 100ms;
  }

  .fa-save:hover {
    transform: scale(1.3);
  }

  .fa-save:active {
    transform: scale(1.2);
  }
  .fa-chevron-left {
    color: #36f669;
  }

  .fa-chevron-right {
    color: #ff3030;
  }

  .sizer {
    top: 3.3rem;
    right: 1.5rem;
    font-size: 1.5rem;

    position: absolute;
    z-index: 10;
    transition: all 100ms;
  }

  .sizer:hover {
    cursor: pointer;
    transform: scale(1.3);
  }

  .sizer:active {
    transform: scale(1.2);
  }

  .editor-container {
    /* border-style: solid; */
    /* border-radius: 0px 0px 8px 8px; */
    /* margin: 0.1rem; */
    width: 100%;
    height: 100%;
    /* height: 90vh; */
    /* width: 100%; */
    /* height: 450px; */
    display: inline-block;
    position: fixed;
    overflow: hidden;
    padding: 0px;
    margin: 0px;
  }

  .ace {
    width: 100%;
    height: 100%;

    /* padding: 0.2rem; */
  }

  .isHidden {
    width: 100%;
  }

  .interpreter {
    top: 3rem;
    right: 1rem;
    position: fixed;
    z-index: 2;
    /* padding: 1rem; */
    width: 45%;
    /* height: 85vh; */
    /* overflow: hidden; */
    /* width: 40%; */
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 0 10px 2px rgba(0, 0, 0, 0.485);
  }
  .hide {
    display: none;
  }

  .tabs {
    overflow-y: auto;
    overflow-x: scroll;
    flex-wrap: nowrap;
    height: 2rem;
    width: 100%;
    padding: 0;
    margin: 0 0;
    display: flex;
    /* list-style: none; */
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
    -webkit-overflow-scrolling: touch;
    background-color: rgba(0, 0, 0, 0.267);
  }
  .tabs::-webkit-scrollbar {
    display: none;
  }

  /* .both {
    width: 100%;
    display: flex;
    flex-direction: row;
  } */

  #editor {
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    position: absolute;
  }

  .new_tab {
    cursor: pointer;
    /* background-color: rgb(47, 47, 47);
    color: white; */
    font-size: 1rem;
    /* margin: 0 0.1rem 0 0; */
    padding: 0.5rem 1rem;
    /* border-radius: 4px 4px 0px 0px; */
    transition: all 100ms;
  }

  .new_tab:hover {
    color: #36f669;
    transform: scale(1.3);
  }

  .new_tab:active {
    color: rgb(46, 209, 89);
    transform: scale(1.2);
  }

  #options {
    font-size: 1rem;
    padding: 0;
    margin: 0;
    align-items: center;
    display: flex;
    position: fixed;
    width: 100%;
    bottom: 0;
    z-index: 25;
    background-color: rgba(0, 0, 0, 0.267);
    white-space: nowrap;
  }

  label {
    padding: 0rem 0.5rem;
  }
  .option {
    background-color: inherit;
    color: inherit;
    border: none;
    margin: 0;
    user-select: none;
    width: 100px;
  }

  .nn {
    width: 50px;
  }

  .love {
    margin-left: 2rem;
    color: #5b5b5b;
  }

  .link {
    text-decoration: none;
    transition: all 100ms;
  }

  .link:hover {
    color: rgb(0, 162, 255);
  }
</style>
