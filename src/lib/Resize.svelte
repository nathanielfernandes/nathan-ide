<script lang="ts">
  import { localstate } from "./state";

  export let initial_dim = 100;
  export let min_dim = 150;
  export let max_dim = 300;
  export let direction: "none" | "left" | "right" | "up" | "down" = "right";
  export let id = `resize-${direction}-${initial_dim}-${min_dim}-${max_dim}`;

  const v = localstate(initial_dim, id, 200);

  export let value = initial_dim;
  v.subscribe((val) => (value = val));

  let expanding = "none";
  let start = 0;
  let initial = { prim: 0, dim: 0 };

  function startExpand(dir: string, event: MouseEvent) {
    expanding = dir;

    let prim = 0;
    switch (expanding) {
      case "left":
      case "right":
        prim = event.clientX;
        break;
      case "up":
      case "down":
        prim = event.clientY;
        break;
    }

    start = prim;
    initial = { prim, dim: $v };
  }

  function stopExpand() {
    expanding = "none";
    start = 0;
    initial = { prim: 0, dim: 0 };
  }

  function expand(event: MouseEvent) {
    if (expanding === "none") return;

    let prim = 0;
    switch (expanding) {
      case "left":
      case "right":
        prim = event.clientX;
        break;
      case "up":
      case "down":
        prim = event.clientY;
        break;
    }

    const delta = prim - start;

    let d = 0;
    switch (expanding) {
      case "left":
        d = initial.dim - delta;
        break;
      case "right":
        d = initial.dim + delta;
        break;
      case "up":
        d = initial.dim - delta;
        break;
      case "down":
        d = initial.dim + delta;
        break;
    }

    v.set(Math.max(min_dim, Math.min(max_dim, d)));
  }

  const dim =
    direction === "left" || direction === "right" ? "width" : "height";
  const d = direction === "left" || direction === "right" ? "h" : "w";
</script>

<svelte:window on:mouseup={stopExpand} on:mousemove={expand} />

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="{d}-full relative select-none" style="{dim}: {$v}px;">
  {#if direction === "right"}
    <div
      class="cursor-col-resize absolute right-0 bg-gray-400 bg-opacity-0 hover:bg-opacity-25 w-3 h-full z-20 transition-all duration-200"
      on:mousedown={startExpand.bind(null, "right")}
    ></div>
  {:else if direction === "left"}
    <div
      class="cursor-col-resize absolute left-0 bg-gray-400 bg-opacity-0 hover:bg-opacity-25 w-3 h-full z-20 transition-all duration-200"
      on:mousedown={startExpand.bind(null, "left")}
    ></div>
  {:else if direction === "up"}
    <div
      class="cursor-row-resize absolute top-0 bg-gray-400 bg-opacity-0 hover:bg-opacity-25 w-full h-3 z-20 transition-all duration-200"
      on:mousedown={startExpand.bind(null, "up")}
    ></div>
  {:else if direction === "down"}
    <div
      class="cursor-row-resize absolute bottom-0 bg-gray-400 bg-opacity-0 hover:bg-opacity-25 w-full h-3 z-20 transition-all duration-200"
      on:mousedown={startExpand.bind(null, "down")}
    ></div>
  {/if}
  <slot />
</div>
