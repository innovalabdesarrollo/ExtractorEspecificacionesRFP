<script>
	import { onMount } from 'svelte';
	import { api } from '$lib/api.js';
	import Alert from '$lib/ui/Alert.svelte';
	import Empty from '$lib/ui/Empty.svelte';
	import Loading from '$lib/ui/Loading.svelte';

	let projects = $state([]);
	let loading = $state(true);
	let error = $state('');
	let name = $state('');
	let clientName = $state('');
	let description = $state('');
	let saving = $state(false);

	async function load() {
		loading = true;
		error = '';
		try {
			projects = await api.projects.list();
		} catch (e) {
			error = e.message;
		} finally {
			loading = false;
		}
	}

	async function create(e) {
		e.preventDefault();
		saving = true;
		error = '';
		try {
			const p = await api.projects.create({ name, clientName, description });
			name = '';
			clientName = '';
			description = '';
			await load();
			location.href = `/proyectos/${p._id}`;
		} catch (err) {
			error = err.message;
		} finally {
			saving = false;
		}
	}

	onMount(load);
</script>

<svelte:head>
	<title>Proyectos · Extractor RFP</title>
</svelte:head>

<section class="space-y-6">
	<div>
		<h1 class="text-2xl font-semibold text-slate-900">Proyectos RFP</h1>
		<p class="mt-1 text-sm text-slate-600">Registra proyecto y cliente, carga archivos y ejecuta el análisis.</p>
	</div>

	{#if error}
		<Alert>{error}</Alert>
	{/if}

	<form class="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-2 sm:p-4" onsubmit={create}>
		<label class="block text-sm">
			<span class="mb-1 block font-medium">Proyecto *</span>
			<input class="tap-target w-full rounded border border-slate-300 px-3 py-2" bind:value={name} required />
		</label>
		<label class="block text-sm">
			<span class="mb-1 block font-medium">Cliente *</span>
			<input class="tap-target w-full rounded border border-slate-300 px-3 py-2" bind:value={clientName} required />
		</label>
		<label class="block text-sm sm:col-span-2">
			<span class="mb-1 block font-medium">Descripción</span>
			<textarea class="w-full rounded border border-slate-300 px-3 py-2" rows="2" bind:value={description}></textarea>
		</label>
		<button
			type="submit"
			disabled={saving}
			class="tap-target w-full rounded bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 sm:col-span-2 sm:w-fit"
		>
			{saving ? 'Creando…' : 'Crear proyecto'}
		</button>
	</form>

	<div class="table-scroll rounded-lg border border-slate-200 bg-white">
		{#if loading}
			<Loading label="Cargando proyectos…" />
		{:else if !projects.length}
			<div class="p-2">
				<Empty>No hay proyectos aún. Crea el primero con el formulario de arriba.</Empty>
			</div>
		{:else}
			<table class="min-w-full text-left text-sm">
				<thead class="bg-slate-50 text-slate-600">
					<tr>
						<th class="px-3 py-2 font-medium">Proyecto</th>
						<th class="px-3 py-2 font-medium">Cliente</th>
						<th class="hidden px-3 py-2 font-medium sm:table-cell">Estado</th>
						<th class="hidden px-3 py-2 font-medium md:table-cell">Creado</th>
					</tr>
				</thead>
				<tbody>
					{#each projects as p}
						<tr class="border-t border-slate-100 hover:bg-[var(--brand-soft)]">
							<td class="px-3 py-2">
								<a class="font-medium text-[var(--brand)] underline" href="/proyectos/{p._id}">{p.name}</a>
								<p class="text-xs text-slate-500 sm:hidden">{p.status}</p>
							</td>
							<td class="px-3 py-2">{p.clientName}</td>
							<td class="hidden px-3 py-2 sm:table-cell">{p.status}</td>
							<td class="hidden px-3 py-2 md:table-cell">{new Date(p.createdAt).toLocaleString('es-MX')}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</section>
