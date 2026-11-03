<script>
	import { onMount } from 'svelte';
	import { api } from '$lib/api.js';
	import Alert from '$lib/ui/Alert.svelte';
	import Empty from '$lib/ui/Empty.svelte';
	import Loading from '$lib/ui/Loading.svelte';

	let projects = $state([]);
	let analyses = $state([]);
	let project = $state('');
	let client = $state('');
	let from = $state('');
	let to = $state('');
	let error = $state('');
	let loading = $state(true);

	async function load() {
		loading = true;
		error = '';
		try {
			const params = {};
			if (project) params.project = project;
			if (client) params.client = client;
			if (from) params.from = from;
			if (to) params.to = to;
			projects = await api.projects.list(params);
			analyses = await api.analyses.list();
		} catch (e) {
			error = e.message;
		} finally {
			loading = false;
		}
	}

	function analysesFor(pid) {
		return analyses.filter((a) => a.projectId === pid);
	}

	onMount(load);
</script>

<svelte:head>
	<title>Historial · Extractor RFP</title>
</svelte:head>

<section class="space-y-5">
	<div>
		<h1 class="text-2xl font-semibold">Historial de análisis</h1>
		<p class="text-sm text-slate-600">Filtra por proyecto, cliente o fecha.</p>
	</div>

	<form
		class="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-4"
		onsubmit={(e) => {
			e.preventDefault();
			load();
		}}
	>
		<label class="text-sm">
			<span class="mb-1 block">Proyecto</span>
			<input class="tap-target w-full rounded border border-slate-300 px-2 py-1.5" bind:value={project} />
		</label>
		<label class="text-sm">
			<span class="mb-1 block">Cliente</span>
			<input class="tap-target w-full rounded border border-slate-300 px-2 py-1.5" bind:value={client} />
		</label>
		<label class="text-sm">
			<span class="mb-1 block">Desde</span>
			<input type="date" class="tap-target w-full rounded border border-slate-300 px-2 py-1.5" bind:value={from} />
		</label>
		<label class="text-sm">
			<span class="mb-1 block">Hasta</span>
			<input type="date" class="tap-target w-full rounded border border-slate-300 px-2 py-1.5" bind:value={to} />
		</label>
		<button
			type="submit"
			class="tap-target w-full rounded bg-[var(--brand)] px-4 py-2 text-sm text-white sm:col-span-2 sm:w-fit lg:col-span-4"
			>Filtrar</button
		>
	</form>

	{#if error}
		<Alert>{error}</Alert>
	{/if}

	{#if loading}
		<Loading label="Cargando historial…" />
	{:else if !projects.length}
		<Empty>Sin resultados para estos filtros. Prueba limpiar o ampliar la búsqueda.</Empty>
	{:else}
		<div class="space-y-3">
			{#each projects as p}
				<article class="rounded-lg border border-slate-200 bg-white p-4 text-sm">
					<div class="flex flex-wrap justify-between gap-2">
						<div>
							<a class="font-medium text-[var(--brand)] underline" href="/proyectos/{p._id}">{p.name}</a>
							<p class="text-slate-600">{p.clientName} · {new Date(p.createdAt).toLocaleDateString('es-MX')}</p>
						</div>
					</div>
					<ul class="mt-2 space-y-1">
						{#each analysesFor(p._id) as a}
							<li class="flex flex-wrap gap-2 text-slate-700">
								<span>{a.versionLabel} · {a.status}</span>
								{#if a.status === 'completado'}
									<a class="underline text-[var(--brand)]" href="/analisis/{a._id}">Ver</a>
								{/if}
							</li>
						{:else}
							<li class="text-slate-500">Sin análisis registrados para este proyecto.</li>
						{/each}
					</ul>
				</article>
			{/each}
		</div>
	{/if}
</section>
