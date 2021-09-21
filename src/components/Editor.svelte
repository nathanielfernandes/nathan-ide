<script>
  import { theme, fontsize, tabs, files } from "./stores.js";

  import Tab from "./Tab.svelte";
  import Interpreter from "./Interpreter.svelte";
  import defaults from "./data/editor_defaults.json";

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
    session.setMode("ace/mode/lisp");
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
    let fn = `file${$tabs.length + 1}.lisp`;

    let session = new ace.EditSession(`;; edit this: ${fn}`);
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

    refocus({ detail: { filename: fn } });
    fix_names();
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
      refocus({ detail: { filename: $tabs[0].filename } });
      save();
    }
  }

  function fix_names() {
    let checked = [];
    let i = 1;

    tabs.set(
      $tabs.map((t) => {
        if (checked.includes(t.filename)) {
          t.filename = `${t.filename.replace(".lisp", "")}_${i}.lisp`;
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
        }
        return t;
      })
    );

    fix_names();
    save();
  }

  function setup_ace() {
    ace.config.set(
      "basePath",
      "https://cdn.jsdelivr.net/npm/ace-builds@1.4.3/src-noconflict/"
    );

    editor = ace.edit("editor");
    updateTheme();
    updateFontSize();
    editor.on("change", save);

    $files.forEach((f) => {
      named_tab(f.filename, f.content);
    });
  }

  function toLocalStorage() {
    // console.log("saved");
    let temp_files = [];

    let focused_session;
    $tabs.forEach((t) => {
      if (t.focused) {
        focused_session = t.session;
      }
      editor.setSession(t.session);
      temp_files.push({ filename: t.filename, content: editor.getValue() });
    });
    editor.setSession(focused_session);
    files.set(temp_files);
  }

  function download(filename, text) {
    var pom = document.createElement("a");
    pom.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(text)
    );
    pom.setAttribute("download", filename);
  }

  const save = debounce(toLocalStorage, 1000);
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
        <div class={"new_tab " + theme_class} on:click={new_tab}>
          <i class="fas fa-plus-square" />
        </div>
        <div
          bind:this={endTab}
          class={"new_tab " + theme_class}
          on:click={() => {
            fileinput.click();
          }}
        >
          <i class="fas fa-file-upload" />
        </div>

        <input
          style="display:none"
          type="file"
          accept=".lisp"
          on:change={(e) => onFileSelected(e)}
          bind:this={fileinput}
          multiple
        />
      </div>

      <div class="editor-container">
        <div id="editor" />
      </div>
      <div id="options" class={theme_class}>
        <div class="option">theme:</div>
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
        <br />
        <div class="option">fontsize:</div>
        <input
          class="option"
          type="number"
          bind:value={session_fontsize}
          on:change={updateFontSize}
        />
      </div>
    </div>

    <div class="interpreter">
      <Interpreter />
    </div>
  </div>
</main>

<svelte:head>
  <script
    on:load={setup_ace}
    src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.12/ace.min.js"></script>
</svelte:head>

<style>
  main {
    /* text-align: center; */
    /* padding: 1em; */
    padding: 0;
    margin: 0;
    height: 100%;
    /* margin: 0 auto; */
  }

  .editor-container {
    /* border-style: solid; */
    /* border-radius: 0px 0px 8px 8px; */
    /* margin: 0.1rem; */
    width: 100%;
    height: 85vh;
    /* width: 100%; */
    /* height: 450px; */
    display: inline-block;
    position: relative;
    overflow: hidden;
    padding: 0px;
    margin: 0px;
  }

  .ace {
    width: 60%;
    /* padding: 0.2rem; */
  }

  .interpreter {
    width: 40%;
  }

  .tabs {
    overflow-y: auto;
    overflow-x: scroll;
    flex-wrap: nowrap;
    height: 34px;
    width: 100%;
    padding: 0;
    margin: 0 0;
    display: flex;
    /* list-style: none; */
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
    -webkit-overflow-scrolling: touch;
  }
  .tabs::-webkit-scrollbar {
    display: none;
  }

  .both {
    width: 100%;
    display: flex;
    flex-direction: row;
  }

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
  }

  .new_tab:active {
    filter: brightness(200%);
  }

  #options {
    font-size: 1rem;
    padding: 0;
    margin: 0;
    align-items: center;
    display: flex;
    filter: brightness(80%);
  }

  .option {
    padding: 0.3rem 1rem;
    background-color: inherit;
    color: inherit;
    border: none;
    margin: 0;
    user-select: none;
  }
</style>
