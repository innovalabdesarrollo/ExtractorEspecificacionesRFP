<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { api } from '$lib/api.js';
	import Alert from '$lib/ui/Alert.svelte';
	import Empty from '$lib/ui/Empty.svelte';
	import Loading from '$lib/ui/Loading.svelte';
	import VersionDiff from '$lib/ui/VersionDiff.svelte';

	let analysis = $state(null);
	let error = $state('');
	let loading = $state(true);
	let filter = $state('todos');
	let versions = $state([]);
	let compareA = $state('');
	let compareB = $state('');
	let compareResult = $state(null);
	let openKey = $state('');

	const id = $derived($page.params.id);

	const archFindings = $derived((analysis?.findings || []).filter((f) => f.isArchitectural));

	const filtered = $derived.by(() => {
		let list = archFindings;
		if (filter === 'encontrado') list = list.filter((f) => f.status === 'encontrado');
		if (filter === 'faltante') list = list.filter((f) => f.status === 'no_encontrado');
		if (filter === 'ambiguo')
			list = list.filter((f) => f.status === 'ambiguo' || f.status === 'contradictorio');
		return list;
	});

	const byCategory = $derived.by(() => {
		const map = new Map();
		for (const f of filtered) {
			const cat = f.categoryName || 'Sin categoría';
			if (!map.has(cat)) map.set(cat, []);
			map.get(cat).push(f);
		}
		return [...map.entries()];
	});

	const counts = $derived({
		total: archFindings.length,
		encontrado: archFindings.filter((f) => f.status === 'encontrado').length,
		faltante: archFindings.filter((f) => f.status === 'no_encontrado').length,
		ambiguo: archFindings.filter(
			(f) => f.status === 'ambiguo' || f.status === 'contradictorio'
		).length,
		adicionales: (analysis?.additional || []).length
	});

	async function load() {
		loading = true;
		error = '';
		try {
			analysis = await api.analyses.get(id);
			versions = await api.analyses.list({ projectId: analysis.projectId });
			compareA = id;
			compareB = versions.find((v) => v._id !== id && v.status === 'completado')?._id || '';
		} catch (e) {
			error = e.message;
		} finally {
			loading = false;
		}
	}

	async function doCompare() {
		if (!compareA || !compareB) return;
		error = '';
		try {
			compareResult = await api.analyses.compare(analysis.projectId, compareA, compareB);
		} catch (e) {
			error = e.message;
		}
	}

	function badge(status) {
		const map = {
			encontrado: 'bg-emerald-100 text-emerald-800',
			no_encontrado: 'bg-amber-100 text-amber-800',
			ambiguo: 'bg-orange-100 text-orange-800',
			contradictorio: 'bg-red-100 text-red-800'
		};
		return map[status] || 'bg-slate-100 text-slate-700';
	}

	onMount(load);
</script>

<svelte:head>
	<title>Arquitecto · {analysis?.projectName || 'RFP'}</title>
</svelte:head>

{#if loading && !analysis}
	<Loading label="Cargando vista arquitecto…" />
{:else if error && !analysis}
	<Alert>{error}</Alert>
{:else}
	<section class="space-y-5">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
			<div class="min-w-0">
				<p class="text-xs font-medium uppercase tracking-wide text-[var(--accent)]">Vista arquitecto</p>
				<a href="/proyectos/{analysis.projectId}" class="text-sm text-[var(--brand)]">← Proyecto</a>
				<h1 class="mt-1 text-xl font-semibold sm:text-2xl">{analysis.projectName}</h1>
				<p class="text-sm text-slate-600 break-words">
					{analysis.clientName} · {analysis.versionLabel} · requisitos arquitectónicos
				</p>
			</div>
			<div class="flex w-full flex-col gap-2 text-sm sm:w-auto sm:flex-row sm:flex-wrap">
				<a
					class="tap-target rounded border border-slate-300 px-3 py-2 text-center hover:bg-slate-50"
					href="/analisis/{id}">Análisis completo</a
				>
				<a
					class="tap-target rounded border border-slate-300 px-3 py-2 text-center hover:bg-slate-50"
					href={api.analyses.exportUrl(id, { format: 'pdf', architectural: true })}>PDF</a
				>
				<a
					class="tap-target rounded border border-slate-300 px-3 py-2 text-center hover:bg-slate-50"
					href={api.analyses.exportUrl(id, { format: 'docx', architectural: true })}>Word</a
				>
				<a
					class="tap-target rounded border border-slate-300 px-3 py-2 text-center hover:bg-slate-50"
					href={api.analyses.exportUrl(id, { format: 'csv', architectural: true })}>CSV</a
				>
			</div>
		</div>

		{#if error}
			<Alert>{error}</Alert>
		{/if}

		{#if analysis.demoMode}
			<Alert type="warn"
				>{analysis.demoNotice ||
					'MODO DEMO: falta ANTHROPIC_API_KEY. Resultados ilustrativos, no evaluación con Claude.'}</Alert
			>
		{/if}

		{#if analysis.summary}
			<p class="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">{analysis.summary}</p>
		{/if}

		<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
			<button
				type="button"
				class="rounded-lg border px-3 py-3 text-left {filter === 'todos'
					? 'border-[var(--brand)] bg-[var(--brand-soft)]'
					: 'border-slate-200 bg-white'}"
				onclick={() => (filter = 'todos')}
			>
				<p class="text-xs text-slate-500">Total arq.</p>
				<p class="text-xl font-semibold">{counts.total}</p>
			</button>
			<button
				type="button"
				class="rounded-lg border px-3 py-3 text-left {filter === 'encontrado'
					? 'border-emerald-600 bg-emerald-50'
					: 'border-slate-200 bg-white'}"
				onclick={() => (filter = 'encontrado')}
			>
				<p class="text-xs text-slate-500">Definidos</p>
				<p class="text-xl font-semibold text-emerald-800">{counts.encontrado}</p>
			</button>
			<button
				type="button"
				class="rounded-lg border px-3 py-3 text-left {filter === 'faltante'
					? 'border-amber-600 bg-amber-50'
					: 'border-slate-200 bg-white'}"
				onclick={() => (filter = 'faltante')}
			>
				<p class="text-xs text-slate-500">Faltantes</p>
				<p class="text-xl font-semibold text-amber-800">{counts.faltante}</p>
			</button>
			<button
				type="button"
				class="rounded-lg border px-3 py-3 text-left {filter === 'ambiguo'
					? 'border-orange-600 bg-orange-50'
					: 'border-slate-200 bg-white'}"
				onclick={() => (filter = 'ambiguo')}
			>
				<p class="text-xs text-slate-500">Ambiguos</p>
				<p class="text-xl font-semibold text-orange-800">{counts.ambiguo}</p>
			</button>
		</div>

		{#if !byCategory.length}
			<Empty>No hay requisitos arquitectónicos para este filtro.</Empty>
		{:else}
			<div class="space-y-4">
				{#each byCategory as [cat, items]}
					<section class="rounded-lg border border-slate-200 bg-white">
						<h2 class="border-b border-slate-100 px-4 py-2 text-sm font-semibold text-[var(--brand)]">
							{cat}
							<span class="font-normal text-slate-500">({items.length})</span>
						</h2>
						<ul class="divide-y divide-slate-100">
							{#each items as f}
								<li class="px-4 py-3 text-sm">
									<div class="flex flex-wrap items-start justify-between gap-2">
										<div class="min-w-0">
											<p class="font-medium">{f.name}</p>
											{#if f.value}
												<p class="text-slate-700">{f.value} {f.unit || ''}</p>
											{/if}
											{#if f.sourceFile}
												<p class="text-xs text-slate-500">
													Fuente: {f.sourceFile}{f.sourceRef ? ` · ${f.sourceRef}` : ''}
												</p>
											{/if}
										</div>
										<span class="rounded px-2 py-0.5 text-xs font-medium {badge(f.status)}">{f.status}</span>
									</div>
									{#if f.evidence}
										<button
											type="button"
											class="mt-2 text-xs text-[var(--brand)] underline"
											onclick={() => (openKey = openKey === f.extractionKey ? '' : f.extractionKey)}
										>
											{openKey === f.extractionKey ? 'Ocultar evidencia' : 'Ver evidencia'}
										</button>
										{#if openKey === f.extractionKey}
											<blockquote
												class="mt-2 border-l-2 border-[var(--brand)] bg-[var(--brand-soft)] px-3 py-2 text-slate-700"
											>
												{f.evidence}
											</blockquote>
										{/if}
									{/if}
								</li>
							{/each}
						</ul>
					</section>
				{/each}
			</div>
		{/if}

		<section class="rounded-lg border border-slate-200 bg-white p-4">
			<h2 class="mb-2 font-medium">Requisitos adicionales del cliente</h2>
			{#if !(analysis.additional || []).length}
				<p class="text-sm text-slate-500">Ninguno detectado fuera del checklist.</p>
			{:else}
				<ul class="space-y-2 text-sm">
					{#each analysis.additional as a}
						<li class="rounded border border-slate-100 px-3 py-2">
							<p class="font-medium">{a.description}</p>
							<p class="text-slate-600">
								{a.value || ''} {a.unit || ''} · {a.sourceFile || '—'} {a.sourceRef || ''}
							</p>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		{#if versions.length > 1}
			<section class="rounded-lg border border-slate-200 bg-white p-4">
				<h2 class="mb-3 font-medium">Comparar versiones del RFP</h2>
				<div class="flex flex-wrap items-end gap-2 text-sm">
					<label>
						<span class="mb-1 block">Versión A</span>
						<select class="rounded border border-slate-300 px-2 py-1" bind:value={compareA}>
							{#each versions as v}
								<option value={v._id}>{v.versionLabel} ({v.status})</option>
							{/each}
						</select>
					</label>
					<label>
						<span class="mb-1 block">Versión B</span>
						<select class="rounded border border-slate-300 px-2 py-1" bind:value={compareB}>
							{#each versions as v}
								<option value={v._id}>{v.versionLabel} ({v.status})</option>
							{/each}
						</select>
					</label>
					<button type="button" class="rounded bg-[var(--brand)] px-3 py-1.5 text-white" onclick={doCompare}
						>Comparar</button
					>
				</div>
				{#if compareResult}
					<div class="mt-4">
						<VersionDiff result={compareResult} architecturalOnly />
					</div>
				{/if}
			</section>
		{/if}
	</section>
{/if}
