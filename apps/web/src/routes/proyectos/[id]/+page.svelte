<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { api } from '$lib/api.js';
	import Alert from '$lib/ui/Alert.svelte';
	import Empty from '$lib/ui/Empty.svelte';
	import Loading from '$lib/ui/Loading.svelte';

	let project = $state(null);
	let files = $state([]);
	let analyses = $state([]);
	let error = $state('');
	let loading = $state(true);
	let uploading = $state(false);
	let analyzing = $state(false);
	let claudeConfigured = $state(true);

	const hasRunning = $derived(
		(analyses || []).some((a) => a.status === 'procesando' || a.status === 'pendiente')
	);
	let uploadRejected = $state([]);
	let editing = $state(false);
	let savingProject = $state(false);
	let editForm = $state({ name: '', clientName: '', description: '' });
	let pollTimer;

	const id = $derived($page.params.id);

	async function load() {
		loading = true;
		error = '';
		try {
			const [p, f, a, h] = await Promise.all([
				api.projects.get(id),
				api.files.list(id),
				api.analyses.list({ projectId: id }),
				api.health().catch(() => null)
			]);
			project = p;
			files = f;
			analyses = a;
			claudeConfigured = h ? Boolean(h.claude?.configured) : true;
			const running = analyses.find((x) => x.status === 'procesando' || x.status === 'pendiente');
			if (running) startPoll(running._id);
		} catch (e) {
			error = e.message;
		} finally {
			loading = false;
		}
	}

	function startPoll(analysisId) {
		clearInterval(pollTimer);
		pollTimer = setInterval(async () => {
			try {
				const a = await api.analyses.get(analysisId);
				analyses = analyses.map((x) => (x._id === a._id ? a : x));
				if (a.status === 'completado' || a.status === 'fallido') {
					clearInterval(pollTimer);
					await load();
				}
			} catch {
				/* ignore */
			}
		}, 2500);
	}

	async function onUpload(e) {
		const list = e.target.files;
		if (!list?.length) return;
		uploading = true;
		error = '';
		uploadRejected = [];
		try {
			const result = await api.files.upload(id, list);
			uploadRejected = result.rejected || [];
			e.target.value = '';
			await load();
		} catch (err) {
			uploadRejected = err.rejected || [];
			error = err.message;
			if (err.accepted?.length) await load();
		} finally {
			uploading = false;
		}
	}

	function rejectLabel(code) {
		if (code === 'FORMAT_INVALID') return 'Formato inválido';
		if (code === 'FILE_CORRUPT') return 'Archivo dañado';
		return code || 'Rechazado';
	}

	async function removeFile(fileId) {
		if (!confirm('¿Eliminar archivo?')) return;
		try {
			await api.files.remove(fileId);
			await load();
		} catch (err) {
			error = err.message;
		}
	}

	async function runAnalysis() {
		analyzing = true;
		error = '';
		try {
			const a = await api.analyses.start(id);
			await load();
			startPoll(a._id);
		} catch (err) {
			error = err.message;
		} finally {
			analyzing = false;
		}
	}

	function startEditProject() {
		editForm = {
			name: project.name || '',
			clientName: project.clientName || '',
			description: project.description || ''
		};
		editing = true;
		error = '';
	}

	function cancelEditProject() {
		editing = false;
	}

	async function saveProject(e) {
		e.preventDefault();
		savingProject = true;
		error = '';
		try {
			project = await api.projects.patch(id, {
				name: editForm.name.trim(),
				clientName: editForm.clientName.trim(),
				description: editForm.description.trim()
			});
			editing = false;
		} catch (err) {
			error = err.message;
		} finally {
			savingProject = false;
		}
	}

	onMount(() => {
		load();
		return () => clearInterval(pollTimer);
	});

	function fmtSize(n) {
		if (n < 1024) return `${n} B`;
		if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
		return `${(n / (1024 * 1024)).toFixed(1)} MB`;
	}

	const STAGE_LABEL = {
		extraccion: 'Extracción',
		evaluacion: 'Evaluación IA',
		consolidacion: 'Consolidación'
	};

	function stageList(a) {
		const defaults = [
			{ stage: 'extraccion', status: 'pendiente' },
			{ stage: 'evaluacion', status: 'pendiente' },
			{ stage: 'consolidacion', status: 'pendiente' }
		];
		if (Array.isArray(a.stages) && a.stages.length) return a.stages;
		return defaults;
	}

	function stageClass(status) {
		if (status === 'completada') return 'bg-emerald-500 text-white';
		if (status === 'en_progreso') return 'bg-[var(--accent)] text-white';
		if (status === 'fallida') return 'bg-red-500 text-white';
		return 'bg-slate-200 text-slate-600';
	}
</script>

<svelte:head>
	<title>{project?.name || 'Proyecto'} · Extractor RFP</title>
</svelte:head>

{#if loading && !project}
	<Loading label="Cargando proyecto…" />
{:else if error && !project}
	<Alert>{error}</Alert>
{:else}
	<section class="space-y-6">
		<div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
			<div class="min-w-0 flex-1">
				<a href="/" class="text-sm text-[var(--brand)]">← Proyectos</a>
				{#if !editing}
					<h1 class="mt-1 text-2xl font-semibold">{project.name}</h1>
					<p class="text-sm text-slate-600">Cliente: {project.clientName}</p>
					{#if project.description}
						<p class="mt-1 text-sm text-slate-500">{project.description}</p>
					{/if}
					<button type="button" class="mt-2 text-sm text-[var(--brand)] underline" onclick={startEditProject}
						>Editar datos</button
					>
				{:else}
					<form class="mt-2 grid max-w-xl gap-2 text-sm" onsubmit={saveProject}>
						<label class="block">
							<span class="mb-1 block font-medium">Proyecto *</span>
							<input class="w-full rounded border border-slate-300 px-3 py-2" bind:value={editForm.name} required />
						</label>
						<label class="block">
							<span class="mb-1 block font-medium">Cliente *</span>
							<input
								class="w-full rounded border border-slate-300 px-3 py-2"
								bind:value={editForm.clientName}
								required
							/>
						</label>
						<label class="block">
							<span class="mb-1 block font-medium">Descripción</span>
							<textarea
								class="w-full rounded border border-slate-300 px-3 py-2"
								rows="2"
								bind:value={editForm.description}
							></textarea>
						</label>
						<div class="flex flex-wrap gap-2">
							<button
								type="submit"
								disabled={savingProject}
								class="rounded bg-[var(--brand)] px-3 py-1.5 text-white disabled:opacity-50"
							>
								{savingProject ? 'Guardando…' : 'Guardar'}
							</button>
							<button
								type="button"
								class="rounded border border-slate-300 px-3 py-1.5"
								onclick={cancelEditProject}>Cancelar</button
							>
						</div>
					</form>
				{/if}
			</div>
			<button
				type="button"
				disabled={analyzing || hasRunning || !files.length}
				onclick={runAnalysis}
				class="tap-target w-full shrink-0 rounded bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40 sm:w-auto"
				title={hasRunning ? 'Ya hay un análisis en curso' : undefined}
			>
				{analyzing
					? 'Iniciando…'
					: hasRunning
						? 'Análisis en curso…'
						: claudeConfigured
							? 'Ejecutar análisis'
							: 'Ejecutar análisis DEMO'}
			</button>
		</div>

		{#if error}
			<Alert>{error}</Alert>
		{/if}

		<div class="rounded-lg border border-slate-200 bg-white p-4">
			<h2 class="mb-3 font-medium">Archivos RFP</h2>
			<label class="mb-3 block text-sm">
				<span class="mb-1 block text-slate-600">PDF, Word o Excel (múltiples). Máx. 25 MB c/u.</span>
				<input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx" onchange={onUpload} disabled={uploading} />
			</label>
			{#if uploadRejected.length}
				<div class="mb-3">
					<Alert type="warn">
						<span class="font-medium">Archivos no cargados:</span>
						{#each uploadRejected as r}
							<br />{rejectLabel(r.code)} — {r.fileName}: {r.reason}
						{/each}
					</Alert>
				</div>
			{/if}
			{#if !files.length}
				<Empty>Sin archivos. Carga al menos uno válido (PDF, Word o Excel) para analizar.</Empty>
			{:else}
				<ul class="divide-y divide-slate-100 text-sm">
					{#each files as f}
						<li class="flex flex-wrap items-center justify-between gap-2 py-2">
							<div>
								<p class="font-medium">{f.fileName}</p>
								<p class="text-slate-500">
									{f.fileType} · {fmtSize(f.size)} · {new Date(f.uploadedAt).toLocaleString('es-MX')} ·
									<span class={f.processingStatus === 'error' ? 'text-red-600' : ''}>{f.processingStatus}</span>
								</p>
								{#if f.lastError}
									<p class="text-xs text-red-600">{f.lastError}</p>
								{/if}
							</div>
							<button type="button" class="text-red-600 hover:underline" onclick={() => removeFile(f._id)}>Eliminar</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<div class="rounded-lg border border-slate-200 bg-white p-4">
			<h2 class="mb-3 font-medium">Análisis</h2>
			{#if !analyses.length}
				<Empty>Aún no hay análisis. Carga archivos y pulsa «Ejecutar análisis».</Empty>
			{:else}
				<ul class="space-y-3 text-sm">
					{#each analyses as a}
						<li class="rounded border border-slate-100 px-3 py-3">
							<div class="flex flex-wrap items-start justify-between gap-2">
								<div>
									<p class="font-medium">
										{a.versionLabel} · {a.status}
										{#if a.demoMode}
											<span class="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900"
												>DEMO · sin API key Anthropic</span
											>
										{/if}
									</p>
									<p class="text-slate-500">{new Date(a.startedAt).toLocaleString('es-MX')}</p>
									{#if a.demoMode && a.demoNotice}
										<p class="mt-1 text-amber-800">{a.demoNotice}</p>
									{/if}
									{#if a.errorMessage}
										<p class="mt-1 text-red-600">{a.errorMessage}</p>
									{/if}
								</div>
								<div class="flex gap-2">
									{#if a.status === 'completado'}
										<a class="text-[var(--brand)] underline" href="/analisis/{a._id}">Resultados</a>
										<a class="text-[var(--brand)] underline" href="/arquitecto/{a._id}">Arquitecto</a>
									{/if}
									{#if a.status === 'fallido'}
										<button
											type="button"
											class="text-[var(--accent)] underline disabled:opacity-40"
											disabled={analyzing || hasRunning}
											onclick={runAnalysis}>Reintentar</button
										>
									{/if}
								</div>
							</div>

							{#if a.status === 'procesando' || a.status === 'pendiente' || (a.stages && a.stages.length)}
								<div class="mt-3 space-y-2">
									<div class="flex items-center justify-between gap-2 text-xs text-slate-600">
										<span>Progreso por etapa</span>
										<span>{a.progressPercentage ?? 0}%</span>
									</div>
									<div class="h-2 overflow-hidden rounded bg-slate-100">
										<div
											class="h-full rounded bg-[var(--brand)] transition-all duration-500"
											style="width: {Math.min(100, Number(a.progressPercentage) || 0)}%"
										></div>
									</div>
									<ol class="grid gap-2 sm:grid-cols-3">
										{#each stageList(a) as st, i}
											<li
												class="rounded px-2 py-1.5 text-xs font-medium {stageClass(st.status)}"
												title={st.status}
											>
												{i + 1}. {STAGE_LABEL[st.stage] || st.stage}
												<span class="opacity-80">· {st.status.replace('_', ' ')}</span>
											</li>
										{/each}
									</ol>
									{#if a.fileResults?.length && (a.status === 'procesando' || a.status === 'completado' || a.status === 'fallido')}
										<ul class="text-xs text-slate-500">
											{#each a.fileResults as fr}
												<li>
													{fr.fileName}: {fr.ok ? 'extraído' : `error — ${fr.error || 'falló'}`}
												</li>
											{/each}
										</ul>
									{/if}
								</div>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</section>
{/if}
