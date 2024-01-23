<script context="module" lang="ts">
  import { onMount } from "svelte";
  import "./ace/ace";

  declare const ace: any;
</script>

<script lang="ts">
  import { slide, fade } from "svelte/transition";

  import {
    theme,
    themes,
    groups,
    focused_group,
    font_size,
    get_focused_tab,
    detect_lang,
    get_focused_group,
  } from "./stores";
  import Resize from "./Resize.svelte";
  import { run, type Response, Result } from "./piston";
  import { debounce } from "./state";

  // set the base path for ace to pull from cdn (so we don't have to bundle it)
  ace.config.set(
    "basePath",
    "https://cdn.jsdelivr.net/npm/ace-builds@1.4.3/src-noconflict/"
  );

  const aceModeList: any = ace.require("ace/ext/modelist");

  $: theme_class = `ace-${$theme.replace("_", "-")}`;

  let editor: any;
  let lang = "plaintext";

  onMount(async () => {
    editor = ace.edit("editor");
    editor.setOptions({
      enableBasicAutocompletion: true,
      enableSnippets: true,
      enableLiveAutocompletion: true,
      highlightActiveLine: false,
    });

    theme.subscribe((value) => {
      editor.setTheme(`ace/theme/${value}`);
    });

    font_size.subscribe((value) => {
      editor.setFontSize(value);
    });

    syncSession();

    editor.on("change", onChange);
    editor.on("focus", syncSession);
  });

  function onChange() {
    let content = editor.getValue();

    groups.update((groups) => {
      let group = groups[$focused_group];
      let tab = group.tabs[group.focused_tab];
      tab.content = content;
      return groups;
    });
  }

  function onTabClick(group_index: number, tab_index: number) {
    groups.update((groups) => {
      groups[group_index].focused_tab = tab_index;
      return groups;
    });

    syncSession();
  }

  function onDeleteTab(group_index: number, tab_index: number) {
    groups.update((groups) => {
      let group = groups[group_index];

      if (group.focused_tab === tab_index) {
        group.focused_tab = 0;
      }

      // if this is the last group and tab then don't delete it
      if (groups.length === 2 && group.tabs.length === 1) {
        return groups;
      }

      // delete the tab
      group.tabs.splice(tab_index, 1);

      // if there are no more tabs in the group, delete the group
      if (group.tabs.length === 0) {
        focused_group.set(Math.max(1, $focused_group - 1));
        groups.splice(group_index, 1);
      }

      return groups;
    });

    syncSession();
  }

  function onGroupClick(group_index: number) {
    focused_group.set(group_index);
    syncSession();
  }

  function syncSession() {
    let tab = get_focused_tab();

    if (!tab.__ace_edit_session__) {
      tab.__ace_edit_session__ = new ace.EditSession(tab.content);

      let undoManager = new ace.UndoManager();
      tab.__ace_edit_session__.setUndoManager(undoManager);
    }

    let mode = aceModeList.getModeForPath(tab.filename);
    tab.__ace_edit_session__.setMode(mode.mode);

    tab.lang = detect_lang(tab.filename);
    lang = tab.lang;

    editor.setSession(tab.__ace_edit_session__);
  }

  function newGroup() {
    groups.update((groups) => {
      groups.push({
        name: "New Group",
        focused_tab: 0,
        tabs: [
          {
            filename: "newfile.txt",
            content: "edit me...",
            lang: "plaintext",
            __ace_edit_session__: null,
          },
        ],
      });

      return groups;
    });

    focused_group.set($groups.length - 1);

    syncSession();
  }

  function newTab() {
    groups.update((groups) => {
      let group = groups[$focused_group];
      group.tabs.push({
        filename: "newfile.txt",
        content: "edit me...",
        lang: "plaintext",
        __ace_edit_session__: null,
      });

      group.focused_tab = group.tabs.length - 1;

      return groups;
    });

    syncSession();
  }

  const bg = "bg-[#00000000] hover:bg-[#ffffff0e] active:bg-[#ffffff18]";

  function handleKeydown(event: KeyboardEvent) {
    // on cmd + s or ctrl + s save to local storage
    if (event.metaKey && event.key === "s") {
      event.preventDefault();
      groups.forceSave();
    }
  }

  let saved = false;
  groups.saved.subscribe((value) => {
    saved = value;
  });

  let side_bar_width = 180;

  let outputs: Response[] = [];

  let bottom: HTMLDivElement;
  onMount(() => {
    bottom.scrollIntoView({ behavior: "smooth" });
  });

  const scrollIntoView = debounce(() => {
    bottom.scrollIntoView({ behavior: "smooth" });
  }, 200);

  function get_stdin() {
    const tab = $groups[0].tabs[0];

    if (!tab.__ace_edit_session__) {
      return "";
    }

    return tab.__ace_edit_session__.getValue();
  }

  async function exec() {
    const group = get_focused_group();

    const stdin = get_stdin();
    const resp = await run(group, stdin);

    outputs = outputs.concat(resp);

    scrollIntoView();
  }
</script>

<div class="relative {theme_class} cc">
  <div class="flex flex-row {theme_class} bg-[#00000057] h-full">
    <Resize initial_dim={180} id="left-side-bar" bind:value={side_bar_width}>
      <div class="text-sm font-bold w-full px-2 py-1">Code Groups</div>
      <div class="w-full float-left">
        {#each $groups as group, i}
          {#if i === 0}
            {@const tab = group.tabs[0]}
            {@const focused = $focused_group === 0 && group.focused_tab === 0}

            <div
              class="flex items-center justify-between mb-2 {focused
                ? 'bg-[#ffffff18]'
                : `${bg} opacity-60`} pr-2"
            >
              <!-- svelte-ignore a11y-click-events-have-key-events -->
              <!-- svelte-ignore a11y-no-static-element-interactions -->
              <div
                class="cursor-pointer w-full flex items-center relative truncate py-0.5 px-1"
                on:click={() => onGroupClick(0)}
              >
                <i
                  class="fa-solid fa-circle text-[5px] mr-2 {focused
                    ? ''
                    : 'opacity-0'}"
                ></i>
                <i class="fa-solid fa-keyboard mr-2 text-sm"></i>

                {tab.filename}
              </div>
            </div>
          {:else}
            {@const group_focused = $focused_group === i}
            <div
              class="{group_focused ? '' : 'opacity-60'} mb-3"
              transition:slide
            >
              <!-- svelte-ignore a11y-click-events-have-key-events -->
              <!-- svelte-ignore a11y-no-static-element-interactions -->
              <div
                class="flex items-center cursor-pointer {bg} py-0.5 px-5"
                on:click={() => onGroupClick(i)}
              >
                <i
                  class="fa-solid text-sm fa-chevron-{group_focused
                    ? 'down'
                    : 'right'} mr-1 w-4"
                ></i>
                <i class="fa-solid fa-folder mr-2"></i>

                {#if group_focused}
                  <input
                    class="w-full outline-none bg-inherit"
                    bind:value={group.name}
                    on:input={() => groups.save()}
                  />
                {:else}
                  {group.name}
                {/if}
              </div>

              {#if group_focused}
                <div transition:slide>
                  {#each group.tabs as tab, j}
                    {@const focused = group_focused && group.focused_tab === j}

                    <div
                      class="flex items-center justify-between {focused
                        ? 'bg-[#ffffff18]'
                        : bg} pr-2"
                    >
                      <!-- svelte-ignore a11y-click-events-have-key-events -->
                      <!-- svelte-ignore a11y-no-static-element-interactions -->
                      <div
                        class="cursor-pointer w-full flex items-center relative truncate py-0.5 px-4"
                        on:click={() => onTabClick(i, j)}
                      >
                        <i
                          class="fa-solid fa-circle text-[5px] mr-2 {focused
                            ? ''
                            : 'opacity-0'}"
                        ></i>
                        <i class="fa-solid fa-code mr-2 text-sm"></i>

                        {#if focused}
                          <input
                            class="w-full outline-none bg-inherit"
                            bind:value={tab.filename}
                            on:input={() => groups.save()}
                          />
                        {:else}
                          {tab.filename}
                        {/if}
                      </div>

                      {#if focused}
                        <button
                          class="w-6 rounded-sm mr-1 text-sm hover:text-red-500"
                          on:click={() => onDeleteTab(i, j)}
                        >
                          <i class="fa-solid fa-xmark"></i>
                        </button>
                      {/if}
                    </div>
                  {/each}

                  <button
                    class="text-sm py-1 px-8 w-full {bg} text-left"
                    on:click={newTab}
                  >
                    <i class="fa-solid fa-plus mr-1"></i>
                    New File</button
                  >
                </div>
              {/if}
            </div>
          {/if}
        {/each}

        <button
          class="mt-2 text-sm py-1 px-4 w-full {bg} text-left"
          on:click={newGroup}
        >
          <i class="fa-solid fa-folder-plus mr-1"></i>
          Add Group</button
        >
      </div>
    </Resize>

    <div class="float-right h-full">
      <div class="w-full h-full absolute" id="editor"></div>

      <div
        class="absolute bottom-0 right-0 z-20 {theme_class}"
        style="width: calc(100% - {side_bar_width}px)"
      >
        <Resize
          direction="up"
          initial_dim={150}
          min_dim={150}
          max_dim={800}
          id="bottom-bar"
        >
          <div
            class="flex flex-col w-full h-full border-t-[1px] border-t-white border-opacity-20 p-2"
          >
            <div class="flex justify-between font-bold">
              <div class="opacity-80 text-sm">
                Detected Language: <code>{lang}</code>
              </div>

              <div class="flex">
                <button
                  on:click={exec}
                  disabled={lang === "plaintext"}
                  class="border-[1px] border-white border-opacity-20 py-0.5 px-2 rounded-md hover:bg-[#ffffff18] active:bg-[#ffffff30] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i class="fa-solid fa-play text-green-500 mr-0.5"></i> Run</button
                >

                <button
                  on:click={() => (outputs = [])}
                  class="border-[1px] border-white border-opacity-20 py-0.5 px-2 rounded-md hover:bg-[#ffffff18] active:bg-[#ffffff30] ml-2"
                >
                  <i class="fa-solid fa-trash text-red-500 mr-0.5"></i> Clear</button
                >
              </div>
            </div>

            <div class="overflow-y-scroll pr-2">
              {#each outputs as { group_name, tab_name, output, language, result }}
                <div class="mb-4" transition:fade={{ duration: 100 }}>
                  <div
                    class="text-sm flex items-center space-x-2 font-bold opacity-70 mb-0.5 ml-0.5"
                  >
                    <span>{group_name}</span>
                    <i class="fa-solid fa-chevron-right"></i>
                    <span>{tab_name}</span>
                    <i class="fa-solid fa-chevron-right"></i>
                    <span>{language}</span>
                  </div>

                  <div
                    class="text-sm font-mono whitespace-pre-wrap bg-[#00000057] p-2 rounded-md"
                  >
                    {#if result === Result.Success}
                      {output}
                    {:else if result === Result.Error}
                      <span class="text-yellow-500">{output}</span>
                    {:else if result === Result.Failure}
                      <span class="text-red-500">{output}</span>
                    {/if}
                  </div>
                </div>
              {/each}
              <div bind:this={bottom}></div>
            </div>
          </div>
        </Resize>
      </div>
    </div>
  </div>
</div>

<div class="h-8 {theme_class}">
  <div
    class="w-full h-full bg-[#0000008e] py-1 px-2 flex items-center justify-between"
  >
    <div class="flex items-center">
      <button
        class="text-xl {saved ? 'text-green-500' : 'text-red-500'} mr-2"
        on:click={() => groups.forceSave()}
        title="Save to local storage"
      >
        <i class="fa-solid fa-floppy-disk"></i>
      </button>

      <div class="mx-4 text-sm flex items-center space-x-1">
        <span>Theme:</span>

        <select class="bg-inherit outline-none" bind:value={$theme}>
          {#each themes as theme}
            <option value={theme}>{theme}</option>
          {/each}
        </select>
      </div>

      <div class="mx-4 text-sm flex items-center space-x-1">
        <span>Scale:</span>
        <input type="range" min="2" max="100" bind:value={$font_size} />
      </div>
    </div>

    <div class="truncate text-sm">
      made with love by
      <a
        class="text-blue-500 hover:underline"
        href="https://github.com/nathanielfernandes">Nathaniel Fernandes</a
      >
    </div>
  </div>
</div>

<svelte:window on:keydown={handleKeydown} />

<style>
  .cc {
    height: calc(100vh - 2rem);
  }

  :global(::-webkit-scrollbar) {
    width: 10px;
  }

  /* Track */
  :global(::-webkit-scrollbar-track) {
    @apply bg-[#00000057];
  }

  /* Handle */
  :global(::-webkit-scrollbar-thumb) {
    @apply bg-[#00000057];
  }

  /* Handle on hover */
  :global(::-webkit-scrollbar-thumb:hover) {
    @apply bg-[#00000057];
  }
</style>
