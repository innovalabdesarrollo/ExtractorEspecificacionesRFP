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
	let obsDraft = $state({});
	let obsByKey = $state({});
	let obsSaving = $state('');
	let compareA = $state('');
	let compareB = $state('');
	let versions = $state([]);
	let compareResult = $state(null);

	const id = $derived($page.params.id);

	const findings = $derived.by(() => {
		let list = analysis?.findings || [];
		if (filter === 'encontrado') list = list.filter((f) => f.status === 'encontrado');
		if (filter === 'faltante') list = list.filter((f) => f.status === 'no_encontrado');
		if (filter === 'ambiguo')
			list = list.filter((f) => f.status === 'ambiguo' || f.status === 'contradictorio');
		return list;
	});

	async function load() {
		loading = true;
		error = '';
		try {
			analysis = await api.analyses.get(id);
			const [vers, obsList] = await Promise.all([
				api.analyses.list({ projectId: analysis.projectId }),
				api.observations.list(id)
			]);
			versions = vers;
			compareA = id;
			compareB = versions.find((v) => v._id !== id && v.status === 'completado')?._id || '';

			const map = {};
			const drafts = { ...obsDraft };
			for (const o of obsList) {
				map[o.extractionKey] = o;
				if (drafts[o.extractionKey] === undefined) {
					drafts[o.extractionKey] = o.comentario;
				}
			}
			for (const f of analysis.findings || []) {
				if (drafts[f.extractionKey] === undefined && f.observation) {
					drafts[f.extractionKey] = f.observation;
				}
			}
			obsByKey = map;
			obsDraft = drafts;
		} catch (e) {
			error = e.message;
		} finally {
			loading = false;
		}
	}

	async function saveObs(key) {
		const comentario = (obsDraft[key] || '').trim();
		if (!comentario) return;
		obsSaving = key;
		error = '';
		try {
			const existing = obsByKey[key];
			if (existing?._id) {
				await api.observations.patch(existing._id, { comentario });
			} else {
				await api.observations.create({ analysisId: id, extractionKey: key, comentario });
			}
			await load();
		} catch (e) {
			error = e.message;
		} finally {
			obsSaving = '';
		}
	}

	async function doCompare() {
		if (!compareA || !compareB) return;
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
	<title>Análisis · Extractor RFP</title>
</svelte:head>

{#if loading && !analysis}
	<Loading label="Cargando análisis…" />
{:else if error && !analysis}
	<Alert>{error}</Alert>
{:else}
	<section class="space-y-5">
		<div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
			<div class="min-w-0">
				<a href="/proyectos/{analysis.projectId}" class="text-sm text-[var(--brand)]">← Proyecto</a>
				<h1 class="mt-1 text-xl font-semibold sm:text-2xl">
					Resultados · {analysis.versionLabel}
				</h1>
				<p class="text-sm text-slate-600 break-words">
					{analysis.projectName} · {analysis.clientName} · {analysis.status}
				</p>
			</div>
			<div class="flex w-full flex-col gap-2 text-sm sm:w-auto sm:flex-row sm:flex-wrap">
				<a
					class="tap-target rounded border border-slate-300 px-3 py-2 text-center hover:bg-slate-50"
					href={api.analyses.exportUrl(id, { format: 'csv' })}
					>CSV</a
				>
				<a
					class="tap-target rounded border border-slate-300 px-3 py-2 text-center hover:bg-slate-50"
					href={api.analyses.exportUrl(id, { format: 'pdf' })}
					>PDF</a
				>
				<a
					class="tap-target rounded border border-slate-300 px-3 py-2 text-center hover:bg-slate-50"
					href={api.analyses.exportUrl(id, { format: 'docx' })}
					>Word</a
				>
				<a
					class="tap-target rounded border border-slate-300 px-3 py-2 text-center hover:bg-slate-50"
					href="/arquitecto/{id}"
				>
					Vista arquitecto
				</a>
			</div>
		</div>

		{#if analysis.demoMode}
			<Alert type="warn"
				>{analysis.demoNotice ||
					'MODO DEMO: falta ANTHROPIC_API_KEY. Resultados ilustrativos, no evaluación con Claude.'}</Alert
			>
		{/if}

		{#if analysis.summary}
			<p class="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">{analysis.summary}</p>
		{/if}

		{#if error}
			<Alert>{error}</Alert>
		{/if}

		<div class="flex flex-wrap gap-2 text-sm">
			{#each [['todos', 'Todos'], ['encontrado', 'Encontrados'], ['faltante', 'Faltantes'], ['ambiguo', 'Ambiguos']] as [v, label]}
				<button
					type="button"
					class="rounded px-3 py-1.5 {filter === v
						? 'bg-[var(--brand)] text-white'
						: 'border border-slate-300 bg-white'}"
					onclick={() => (filter = v)}>{label}</button
				>
			{/each}
		</div>

		<div class="space-y-3">
			{#each findings as f}
				<article class="rounded-lg border border-slate-200 bg-white p-4 text-sm">
					<div class="flex flex-wrap items-start justify-between gap-2">
						<div>
							<h3 class="font-medium">{f.name}</h3>
							<p class="text-slate-500">{f.categoryName}</p>
						</div>
						<span class="rounded px-2 py-0.5 text-xs font-medium {badge(f.status)}">{f.status}</span>
					</div>
					{#if f.value}
						<p class="mt-2"><span class="text-slate-500">Valor:</span> {f.value} {f.unit || ''}</p>
					{/if}
					{#if f.sourceFile}
						<p class="mt-1 text-slate-600">
							Fuente: {f.sourceFile}{f.sourceRef ? ` · ${f.sourceRef}` : ''}
						</p>
					{/if}
					{#if f.evidence}
						<blockquote class="mt-2 border-l-2 border-[var(--brand)] bg-[var(--brand-soft)] px-3 py-2 text-slate-700">
							{f.evidence}
						</blockquote>
					{:else if f.status === 'encontrado'}
						<p class="mt-2 text-amber-700">Sin evidencia textual suficiente.</p>
					{/if}
					{#if f.alternateValues?.length}
						<details class="mt-2">
							<summary class="cursor-pointer text-[var(--brand)]">Valores alternos / conflictos</summary>
							<ul class="mt-1 list-disc pl-5">
								{#each f.alternateValues as alt}
									<li>{alt.value} {alt.unit || ''} ({alt.sourceFile || '—'})</li>
								{/each}
							</ul>
						</details>
					{/if}
					<div class="mt-2 space-y-1">
						<label class="block text-xs font-medium text-slate-500">
							Observación interna {obsByKey[f.extractionKey] ? '(editar)' : '(nueva)'}
						</label>
						<div class="flex flex-wrap gap-2">
							<input
								class="min-w-[12rem] flex-1 rounded border border-slate-300 px-2 py-1"
								placeholder="Aclaración o pendiente para la propuesta"
								bind:value={obsDraft[f.extractionKey]}
							/>
							<button
								type="button"
								disabled={obsSaving === f.extractionKey}
								class="rounded bg-slate-800 px-3 py-1 text-white disabled:opacity-50"
								onclick={() => saveObs(f.extractionKey)}
							>
								{obsSaving === f.extractionKey
									? 'Guardando…'
									: obsByKey[f.extractionKey]
										? 'Actualizar'
										: 'Guardar'}
							</button>
						</div>
					</div>
				</article>
			{/each}
			{#if !findings.length}
				<Empty>Sin resultados para este filtro.</Empty>
			{/if}
		</div>

		<div class="rounded-lg border border-slate-200 bg-white p-4">
			<h2 class="mb-3 font-medium">Especificaciones adicionales</h2>
			{#if !(analysis.additional || []).length}
				<Empty>Ninguna especificación adicional detectada.</Empty>
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
		</div>

		{#if versions.length > 1}
			<div class="rounded-lg border border-slate-200 bg-white p-4">
				<h2 class="mb-3 font-medium">Comparar versiones</h2>
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
						<VersionDiff result={compareResult} />
					</div>
				{/if}
			</div>
		{/if}
	</section>
{/if}
