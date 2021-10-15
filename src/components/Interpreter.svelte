<script>
  import { createEventDispatcher } from "svelte";
  import { fontsize, tabs, files } from "./stores.js";
  import { debounce } from "./helpers.js";

  const dispatch = createEventDispatcher();

  let focused_tab = "Piston Interpreter";
  tabs.subscribe((value) => {
    let found = value.find((t) => t.focused);
    if (found !== undefined) {
      focused_tab = found.filename;
    }
  });

  let code_files = [];
  files.subscribe((value) => {
    code_files = value;
  });

  let stdin = "";
  let stdin_menu = false;

  function createBody() {
    let focused;
    let codes = [];
    // console.log(code_files);
    code_files.forEach((f) => {
      if (f.filename === focused_tab) {
        focused = f;
      } else {
        codes.push({ name: f.filename, content: f.content });
      }
    });

    let fixed = [{ name: focused.filename, content: focused.content }].concat(
      codes
    );

    let [_name, ext] = focused.filename.split(".");

    return JSON.stringify({
      language: ext,
      version: "*",
      files: fixed,
      stdin: stdin,
    });
  }

  // let output = "output will appear here...";
  // let last;

  let outputs = [
    {
      header: "output:",
      content: "output will appear here...",
      type: "ok",
    },
  ];

  async function run_code(do_clear) {
    dispatch("execute");
    if (do_clear) {
      clear();
    }
    const body = createBody();

    const res = await fetch("https://emkc.org/api/v2/piston/execute", {
      method: "POST",
      body: body,
    }).then((r) => r.json());

    let out;
    let type;
    if (res.message === undefined) {
      out = res.run.output;
      if (out.length === 0) {
        type = "warning";
      } else {
        type = res.run.stderr === "" ? "ok" : "error";
      }
    } else {
      out = res.message;
      type = "warning";
    }
    outputs = outputs.concat([
      { header: `${focused_tab}:`, content: out, type: type },
    ]);
  }

  let bottom;
  const scroll = debounce(() => {
    bottom.scrollIntoView({ behavior: "smooth" });
  }, 200);

  let promise;
  const refs = [];
  function run(clear) {
    stdin_menu = false;
    promise = run_code(clear);
    scroll();
  }

  function clear() {
    outputs = [];
  }

  function RunKeyBind(event) {
    if (event.key == "Enter" && event.ctrlKey) {
      run(false);
    }
  }
</script>

<svelte:window on:keydown={RunKeyBind} />

<div class="everythang">
  <div class="top">
    <div
      style="color:#36f669;"
      class="tool"
      on:click={() => {
        run(true);
      }}
    >
      <i class="fas fa-play" /> Run
    </div>
    <div
      style="color:#ffba31;"
      class="tool"
      on:click={() => {
        run(false);
      }}
    >
      <i class="fas fa-caret-square-down" /> Again
    </div>
    <div style="color:#fe4444;" class="tool" on:click={clear}>
      <i class="fas fa-sync-alt" /> Clear
    </div>
    <div
      style="color:white"
      class={`tool ${stdin_menu ? "toggled" : ""}`}
      on:click={() => {
        stdin_menu = !stdin_menu;
      }}
    >
      <i class="fas fa-keyboard" /> Stdin
    </div>
    {#if stdin_menu}
      <p style="margin-left: 1rem; color: white">editing stdin</p>
    {/if}
  </div>
  {#if !stdin_menu}
    <div class="code" id="output-container">
      <div class="inner">
        <code class="code inner" style={`font-size: ${$fontsize}px`}>
          {#each outputs as { header, content, type }, i}
            <div bind:this={refs[i]} class="code-out">
              <span class={`header ${type}`}>
                {i}
                <i class="fas fa-chevron-right" /><i
                  class="fas fa-chevron-right"
                />
                {header}
              </span>
              <span>
                {content}
              </span>
            </div>
          {/each}
          <div bind:this={bottom}>
            {#await promise}
              running...
            {:catch error}
              {error.message}
            {/await}
          </div>
        </code>
      </div>
    </div>
  {:else}
    <div class="stdin">
      <code>
        <textarea
          style={`font-size: ${$fontsize}px`}
          spellcheck="false"
          placeholder="Enter multiple values in separate lines..."
          class="enter"
          bind:value={stdin}
        />
      </code>
    </div>
  {/if}
  <div class="bottom">{focused_tab}</div>
</div>

<style>
  .everythang {
    height: 100%;
  }
  .header {
    font-weight: 900;
  }

  .ok {
    color: #36f669;
  }

  .warning {
    color: #ffb406;
  }

  .error {
    color: #ff3030;
  }

  .tool {
    user-select: none;
    padding: 8px 0.5rem;
    transition: all 100ms;
  }

  .tool:hover {
    cursor: pointer;
    background-color: rgb(93, 93, 93);
  }

  .tool:active {
    background-color: rgb(154, 154, 154);
  }

  .toggled {
    background-color: rgb(122, 122, 122);
  }

  .top {
    align-items: center;
    height: 2rem;
    display: flex;
    background-color: rgb(44, 44, 44);
  }

  .bottom {
    user-select: none;
    justify-content: center;
    display: flex;
    align-items: center;
    color: rgb(110, 110, 110);
    height: 2rem;
    background-color: rgb(44, 44, 44);
  }

  .code {
    white-space: pre-wrap;

    text-align: left;
    justify-content: left;
    width: 100%;
    height: 100%;
    color: white;
    /* border-radius: 8px; */
    background-color: rgb(29, 29, 29);
  }

  .inner {
    padding: 0rem 1rem;
  }

  .code-out {
    display: flex;
    flex-direction: column;
    margin-bottom: 1rem;
    transition: all 100ms;
    padding: 0.5rem;
    border-radius: 10px;
  }

  .code::-webkit-scrollbar {
    display: none;
  }

  .code-out:hover {
    background-color: rgb(38, 38, 38);
  }

  #output-container {
    width: 100%;
    /* color: black; */
    height: 100%;
    padding: 0;
    overflow-wrap: break-word;
    overflow-x: hidden;
    overflow-y: scroll;
    height: 80vh;
  }

  .stdin {
    width: 100%;
    height: 100%;
    height: 80vh;
  }

  .stdin .enter {
    width: 100%;
    height: 100%;
    resize: none;
    border: none;
    outline: none;
    background-color: rgb(29, 29, 29);
    color: white;
  }
</style>
