<script>
  import { fontsize, tabs, files } from "./stores.js";
  import { debounce } from "./helpers.js";

  const ERROR = /\{\d+\}>:\s(.*)\s/gimu;

  let focused_tab = "Common Lisp Interpreter";
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
    return JSON.stringify({ language: "lisp", version: "2.1.2", files: fixed });
  }

  // let output = "output will appear here...";
  let last;
  let outputs = [
    {
      header: "output:",
      content: "output will appear here...",
      type: "ok",
    },
  ];

  async function run_code(do_clear) {
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
        if (
          Array.from(out.matchAll(ERROR)).length > 0 ||
          out.includes("fatal error encountered in SBCL")
        ) {
          type = "error";
        } else {
          type = "ok";
        }
      }
    } else {
      out = "Slow Down! You are being Ratelimited";
      type = "warning";
    }
    outputs = outputs.concat([
      { header: `${focused_tab}:`, content: out, type: type },
    ]);

    // output += `\n\n>> ${focused_tab}:`;
    // if (res.message === undefined) {
    //   if (res.run.output.startsWith("\n")) {
    //     output += res.run.output;
    //   } else {
    //     output += "\n" + res.run.output;
    //   }
    // } else {
    //   output += "\nSlow Down! You are being Ratelimited";
    // }
  }

  // const run = debounce(run_code, 1000);
  let bottom;

  const scroll = debounce(() => {
    bottom.scrollIntoView({ behavior: "smooth" });
  }, 200);

  let promise;
  const refs = [];
  function run(clear) {
    promise = run_code(clear);
    scroll();
    // refs[refs.length - 1].scrollIntoView({
    //   behavior: "smooth",
    //   alightToTop: true,
    // });
  }

  function clear() {
    outputs = [];
  }


  function RunKeyBind(event){
    if (event.key == "Enter" && event.shiftKey){
    run(true);
  }
  }

</script>

<svelte:window on:keydown={RunKeyBind}/>

<div>
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
  </div>
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
  <div class="bottom">Lisp v2.1.2 &nbsp; {focused_tab}</div>
</div>

<style>
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

  .top {
    align-items: center;
    height: 34px;
    display: flex;
    background-color: rgb(44, 44, 44);
  }

  .bottom {
    user-select: none;
    justify-content: center;
    display: flex;
    align-items: center;
    color: rgb(110, 110, 110);
    height: 34px;
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
  }

  .code-out:hover {
    background-color: rgb(38, 38, 38);
  }

  #output-container {
    width: 100%;
    color: black;
    height: 85vh;
    padding: 0;
    overflow-wrap: break-word;
    overflow-x: hidden;
    overflow-y: scroll;
  }
</style>
