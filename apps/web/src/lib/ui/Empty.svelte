<script>
	/** @type {{ children: import('svelte').Snippet }} */
	let { children } = $props();
</script>

<p class="rounded border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
	{@render children()}
</p>
