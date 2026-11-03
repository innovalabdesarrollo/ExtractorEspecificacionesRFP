<script>
	/** @type {{ type?: 'error' | 'warn' | 'ok', children: import('svelte').Snippet }} */
	let { type = 'error', children } = $props();

	const cls = $derived(
		type === 'ok'
			? 'border-emerald-200 bg-emerald-50 text-emerald-800'
			: type === 'warn'
				? 'border-amber-200 bg-amber-50 text-amber-900'
				: 'border-red-200 bg-red-50 text-red-700'
	);
</script>

<p class="rounded border px-3 py-2 text-sm {cls}" role="alert">
	{@render children()}
</p>
