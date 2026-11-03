<script>
	import { onMount } from 'svelte';
	import '../app.css';
	import { api } from '$lib/api.js';
	import Alert from '$lib/ui/Alert.svelte';

	let { children } = $props();
	let claudeReady = $state(true);
	let apiDown = $state(false);

	onMount(async () => {
		try {
			const h = await api.health();
			claudeReady = Boolean(h?.claude?.configured);
			apiDown = false;
		} catch {
			apiDown = true;
			claudeReady = true;
		}
	});
</script>

<div class="min-h-screen">
	<header class="sticky top-0 z-20 border-b border-slate-200 bg-[var(--brand)] text-white shadow-sm">
		<div class="mx-auto flex max-w-6xl flex-col gap-2 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-4">
			<a href="/" class="truncate text-base font-semibold tracking-tight sm:text-lg">
				<span class="sm:hidden">Extractor RFP</span>
				<span class="hidden sm:inline">Extractor RFP · Lintel</span>
			</a>
			<nav class="flex w-full gap-1 overflow-x-auto text-sm sm:w-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
				<a class="tap-target shrink-0 rounded px-3 py-2 hover:bg-white/10" href="/">Proyectos</a>
				<a class="tap-target shrink-0 rounded px-3 py-2 hover:bg-white/10" href="/historial">Historial</a>
				<a class="tap-target shrink-0 rounded px-3 py-2 hover:bg-white/10" href="/checklist">Checklist</a>
			</nav>
		</div>
	</header>
	<main class="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-6">
		{#if apiDown}
			<div class="mb-4">
				<Alert>No se pudo contactar la API. Arranca con <code class="text-xs">pnpm dev</code> (puerto 3052).</Alert>
			</div>
		{:else if !claudeReady}
			<div class="mb-4">
				<Alert type="warn"
					>Falta <code class="text-xs">ANTHROPIC_API_KEY</code> de Anthropic en <code class="text-xs">.env</code>. Puedes ejecutar un
					<strong>análisis DEMO</strong> (coincidencias locales sobre el texto; no es Claude). Con la key: reinicia la API y
					<code class="text-xs">pnpm smoke</code>.</Alert
				>
			</div>
		{/if}
		{@render children()}
	</main>
</div>
