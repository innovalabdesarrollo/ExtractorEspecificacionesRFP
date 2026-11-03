<script>
	import Empty from './Empty.svelte';

	/** @type {{ result: { a: any, b: any, changes: any[] }, architecturalOnly?: boolean }} */
	let { result, architecturalOnly = false } = $props();

	let typeFilter = $state('todos');

	const typeLabel = {
		modificado: 'Modificado',
		nuevo: 'Solo en B',
		eliminado: 'Solo en A',
		sin_cambio: 'Sin cambio'
	};

	const typeClass = {
		modificado: 'bg-sky-100 text-sky-800',
		nuevo: 'bg-emerald-100 text-emerald-800',
		eliminado: 'bg-amber-100 text-amber-800'
	};

	const statusClass = {
		encontrado: 'text-emerald-800',
		no_encontrado: 'text-amber-800',
		ambiguo: 'text-orange-800',
		contradictorio: 'text-red-800'
	};

	function isArch(c) {
		return Boolean(c.a?.isArchitectural || c.b?.isArchitectural);
	}

	const baseChanges = $derived(
		(result?.changes || []).filter(
			(c) => c.type !== 'sin_cambio' && (!architecturalOnly || isArch(c))
		)
	);

	const counts = $derived({
		todos: baseChanges.length,
		modificado: baseChanges.filter((c) => c.type === 'modificado').length,
		nuevo: baseChanges.filter((c) => c.type === 'nuevo').length,
		eliminado: baseChanges.filter((c) => c.type === 'eliminado').length
	});

	const visible = $derived(
		typeFilter === 'todos' ? baseChanges : baseChanges.filter((c) => c.type === typeFilter)
	);

	function side(f) {
		if (!f) return null;
		const val = [f.value, f.unit].filter(Boolean).join(' ').trim();
		return {
			status: f.status || '—',
			value: val || '—',
			source: [f.sourceFile, f.sourceRef].filter(Boolean).join(' · ') || '—',
			category: f.categoryName || ''
		};
	}
</script>

{#if !result}
	<!-- vacío hasta comparar -->
{:else}
	<div class="space-y-3">
		<div class="flex flex-wrap items-baseline justify-between gap-2 text-sm">
			<p class="text-slate-600">
				<span class="font-medium text-slate-800">{result.a.versionLabel}</span>
				<span class="text-slate-400">vs</span>
				<span class="font-medium text-slate-800">{result.b.versionLabel}</span>
				<span class="text-slate-500">· {counts.todos} cambio{counts.todos === 1 ? '' : 's'}</span>
			</p>
		</div>

		<div class="flex flex-wrap gap-2 text-sm">
			{#each [
				['todos', `Todos (${counts.todos})`],
				['modificado', `Modificados (${counts.modificado})`],
				['nuevo', `Solo B (${counts.nuevo})`],
				['eliminado', `Solo A (${counts.eliminado})`]
			] as [v, label]}
				<button
					type="button"
					class="rounded px-3 py-1.5 {typeFilter === v
						? 'bg-[var(--brand)] text-white'
						: 'border border-slate-300 bg-white'}"
					onclick={() => (typeFilter = v)}>{label}</button
				>
			{/each}
		</div>

		{#if !visible.length}
			<Empty>No hay diferencias para este filtro.</Empty>
		{:else}
			<ul class="space-y-3">
				{#each visible as c}
					{@const sa = side(c.a)}
					{@const sb = side(c.b)}
					<li class="overflow-hidden rounded-lg border border-slate-200 bg-white">
						<div class="flex flex-wrap items-center gap-2 border-b border-slate-100 px-3 py-2">
							<span
								class="rounded px-2 py-0.5 text-xs font-medium {typeClass[c.type] || 'bg-slate-100'}"
								>{typeLabel[c.type] || c.type}</span
							>
							<span class="min-w-0 font-medium text-sm">{c.name}</span>
							{#if sa?.category || sb?.category}
								<span class="text-xs text-slate-500">{sa?.category || sb?.category}</span>
							{/if}
						</div>
						<div class="grid grid-cols-1 sm:grid-cols-2">
							<div
								class="border-b border-slate-100 px-3 py-3 text-sm sm:border-b-0 sm:border-r {c.type ===
								'nuevo'
									? 'bg-slate-50 text-slate-400'
									: ''}"
							>
								<p class="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
									{result.a.versionLabel}
								</p>
								{#if sa}
									<p class="font-medium {statusClass[sa.status] || ''}">{sa.status}</p>
									<p class="mt-0.5 text-slate-800">{sa.value}</p>
									<p class="mt-1 text-xs text-slate-500">{sa.source}</p>
								{:else}
									<p class="italic text-slate-400">No existía en esta versión</p>
								{/if}
							</div>
							<div
								class="px-3 py-3 text-sm {c.type === 'eliminado' ? 'bg-slate-50 text-slate-400' : ''}"
							>
								<p class="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
									{result.b.versionLabel}
								</p>
								{#if sb}
									<p class="font-medium {statusClass[sb.status] || ''}">{sb.status}</p>
									<p class="mt-0.5 text-slate-800">{sb.value}</p>
									<p class="mt-1 text-xs text-slate-500">{sb.source}</p>
								{:else}
									<p class="italic text-slate-400">Ya no aparece en esta versión</p>
								{/if}
							</div>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
{/if}
