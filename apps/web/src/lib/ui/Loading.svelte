<script>
	/** @type {{ label?: string }} */
	let { label = 'Cargando…' } = $props();
</script>

<p class="p-4 text-sm text-slate-500" aria-live="polite" aria-busy="true">{label}</p>
