<script>
	import { onMount } from 'svelte';
	import { api } from '$lib/api.js';
	import Alert from '$lib/ui/Alert.svelte';
	import Empty from '$lib/ui/Empty.svelte';
	import Loading from '$lib/ui/Loading.svelte';

	let categories = $state([]);
	let units = $state([]);
	let specs = $state([]);
	let changes = $state([]);
	let validation = $state(null);
	let error = $state('');
	let loading = $state(true);
	let saving = $state(false);
	let tab = $state('specs');
	let filterCat = $state('');
	let filterActive = $state('');
	let filterDataType = $state('');
	let q = $state('');

	const emptyCat = () => ({
		_id: null,
		name: '',
		description: '',
		isArchitectural: false
	});
	let formCat = $state(emptyCat());
	const editingCat = $derived(Boolean(formCat._id));
	let newUnit = $state({ name: '', symbol: '', measurementType: 'otro' });

	const emptySpec = () => ({
		_id: null,
		name: '',
		description: '',
		categoryId: '',
		unitId: '',
		altUnitIds: [],
		requiresMeasurement: false,
		dataType: 'texto',
		isActive: true,
		evaluationCriteria: { instructions: '', synonyms: '', examples: '' }
	});

	let formSpec = $state(emptySpec());
	const editing = $derived(Boolean(formSpec._id));

	async function load() {
		loading = true;
		error = '';
		try {
			const params = {};
			if (filterCat) params.categoryId = filterCat;
			if (filterActive) params.isActive = filterActive;
			if (filterDataType) params.dataType = filterDataType;
			if (q) params.q = q;
			[categories, units, specs, changes] = await Promise.all([
				api.checklist.categories(),
				api.checklist.units(),
				api.checklist.specs(params),
				api.checklist.changes()
			]);
		} catch (e) {
			error = e.message;
		} finally {
			loading = false;
		}
	}

	function startEditCat(c) {
		formCat = {
			_id: c._id,
			name: c.name || '',
			description: c.description || '',
			isArchitectural: Boolean(c.isArchitectural)
		};
		error = '';
	}

	function cancelEditCat() {
		formCat = emptyCat();
	}

	async function saveCategory(e) {
		e.preventDefault();
		error = '';
		try {
			const body = {
				name: formCat.name,
				description: formCat.description,
				isArchitectural: formCat.isArchitectural
			};
			if (editingCat) {
				await api.checklist.patchCategory(formCat._id, body);
			} else {
				await api.checklist.createCategory(body);
			}
			formCat = emptyCat();
			await load();
		} catch (err) {
			error = err.message;
		}
	}

	async function addUnit(e) {
		e.preventDefault();
		error = '';
		try {
			await api.checklist.createUnit(newUnit);
			newUnit = { name: '', symbol: '', measurementType: 'otro' };
			await load();
		} catch (err) {
			error = err.message;
		}
	}

	function criteriaPayload(ec) {
		return {
			instructions: ec.instructions || '',
			synonyms: String(ec.synonyms || '')
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean),
			examples: String(ec.examples || '')
				.split('\n')
				.map((s) => s.trim())
				.filter(Boolean)
		};
	}

	function startEdit(s) {
		formSpec = {
			_id: s._id,
			name: s.name || '',
			description: s.description || '',
			categoryId: s.categoryId || '',
			unitId: s.unitId || '',
			altUnitIds: (s.altUnitIds || []).map(String),
			requiresMeasurement: Boolean(s.requiresMeasurement),
			dataType: s.dataType || 'texto',
			isActive: s.isActive !== false,
			evaluationCriteria: {
				instructions: s.evaluationCriteria?.instructions || '',
				synonyms: (s.evaluationCriteria?.synonyms || []).join(', '),
				examples: (s.evaluationCriteria?.examples || []).join('\n')
			}
		};
		error = '';
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function toggleAltUnit(unitId) {
		const id = String(unitId);
		const cur = formSpec.altUnitIds || [];
		if (cur.includes(id)) {
			formSpec.altUnitIds = cur.filter((x) => x !== id);
		} else {
			formSpec.altUnitIds = [...cur, id];
		}
	}

	function cancelEdit() {
		formSpec = emptySpec();
	}

	async function saveSpec(e) {
		e.preventDefault();
		saving = true;
		error = '';
		try {
			const primary = formSpec.unitId || null;
			const body = {
				name: formSpec.name,
				description: formSpec.description,
				categoryId: formSpec.categoryId,
				unitId: primary,
				altUnitIds: (formSpec.altUnitIds || []).filter((id) => id && id !== primary),
				requiresMeasurement: formSpec.requiresMeasurement,
				dataType: formSpec.dataType,
				isActive: formSpec.isActive,
				evaluationCriteria: criteriaPayload(formSpec.evaluationCriteria)
			};
			if (editing) {
				await api.checklist.patchSpec(formSpec._id, body);
			} else {
				await api.checklist.createSpec(body);
			}
			formSpec = emptySpec();
			await load();
		} catch (err) {
			error = err.message;
		} finally {
			saving = false;
		}
	}

	async function toggleSpec(s) {
		error = '';
		try {
			await api.checklist.patchSpec(s._id, { isActive: !s.isActive });
			await load();
		} catch (err) {
			error = err.message;
		}
	}

	async function duplicate(s) {
		const name = prompt('Nombre único para la copia:', `${s.name} (copia)`);
		if (!name) return;
		error = '';
		try {
			await api.checklist.duplicateSpec(s._id, name);
			await load();
		} catch (err) {
			error = err.message;
		}
	}

	async function validate() {
		validation = await api.checklist.validate();
	}

	/** Reordena categoría intercambiando displayOrder con vecina (API ya soporta PATCH). */
	async function moveCategory(c, direction) {
		error = '';
		const sorted = [...categories].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
		const i = sorted.findIndex((x) => x._id === c._id);
		const j = direction === 'up' ? i - 1 : i + 1;
		if (i < 0 || j < 0 || j >= sorted.length) return;
		const other = sorted[j];
		const orderA = c.displayOrder ?? i + 1;
		const orderB = other.displayOrder ?? j + 1;
		try {
			await Promise.all([
				api.checklist.patchCategory(c._id, { displayOrder: orderB }),
				api.checklist.patchCategory(other._id, { displayOrder: orderA })
			]);
			await load();
		} catch (err) {
			error = err.message;
		}
	}

	function catName(id) {
		return categories.find((c) => c._id === id)?.name || '—';
	}
	function unitSym(id) {
		return units.find((u) => String(u._id) === String(id))?.symbol || '—';
	}

	function altSyms(s) {
		const ids = s.altUnitIds || [];
		if (!ids.length) return '';
		return ids.map((id) => unitSym(id)).filter((x) => x !== '—').join(', ');
	}

	onMount(load);
</script>

<svelte:head>
	<title>Checklist · Extractor RFP</title>
</svelte:head>

<section class="space-y-5">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<h1 class="text-2xl font-semibold">Checklist de especificaciones</h1>
			<p class="text-sm text-slate-600">Categorías, unidades, criterios y validación.</p>
		</div>
		<button type="button" class="rounded bg-[var(--brand)] px-3 py-1.5 text-sm text-white" onclick={validate}
			>Validar integridad</button
		>
	</div>

	{#if validation}
		<div
			class="rounded border px-3 py-2 text-sm {validation.ok
				? 'border-emerald-200 bg-emerald-50 text-emerald-800'
				: 'border-amber-200 bg-amber-50 text-amber-900'}"
		>
			{#if validation.ok}
				Checklist listo ({validation.total} specs).
			{:else}
				{validation.errorCount} problemas:
				<ul class="mt-1 list-disc pl-5">
					{#each validation.errors as e}
						<li>{e.name}: {e.issues.join(', ')}</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/if}

	{#if error}
		<Alert>{error}</Alert>
	{/if}

	{#if loading}
		<Loading label="Cargando checklist…" />
	{/if}

	<div class="flex flex-wrap gap-2 text-sm">
		{#each [['specs', 'Especificaciones'], ['cats', 'Categorías'], ['units', 'Unidades'], ['hist', 'Historial']] as [v, label]}
			<button
				type="button"
				class="rounded px-3 py-1.5 {tab === v ? 'bg-[var(--brand)] text-white' : 'border border-slate-300 bg-white'}"
				onclick={() => (tab = v)}>{label}</button
			>
		{/each}
	</div>

{#if !loading}
	{#if tab === 'specs'}
		<form
			class="grid gap-2 rounded-lg border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2"
			onsubmit={saveSpec}
		>
			<p class="sm:col-span-2 font-medium text-slate-800">
				{editing ? 'Editar especificación' : 'Nueva especificación'}
			</p>
			<input class="rounded border px-2 py-1.5" placeholder="Nombre *" bind:value={formSpec.name} required />
			<select class="rounded border px-2 py-1.5" bind:value={formSpec.categoryId} required>
				<option value="">Categoría *</option>
				{#each categories as c}
					<option value={c._id}>{c.name}</option>
				{/each}
			</select>
			<textarea
				class="rounded border px-2 py-1.5 sm:col-span-2"
				rows="2"
				placeholder="Descripción"
				bind:value={formSpec.description}
			></textarea>
			<select class="rounded border px-2 py-1.5" bind:value={formSpec.unitId}>
				<option value="">Unidad principal</option>
				{#each units as u}
					<option value={u._id}>{u.name} ({u.symbol})</option>
				{/each}
			</select>
			<select class="rounded border px-2 py-1.5" bind:value={formSpec.dataType}>
				<option value="texto">Tipo: texto</option>
				<option value="numerico">Tipo: numérico</option>
				<option value="booleano">Tipo: booleano</option>
			</select>
			<label class="flex items-center gap-2">
				<input type="checkbox" bind:checked={formSpec.requiresMeasurement} /> Requiere medición
			</label>
			<label class="flex items-center gap-2">
				<input type="checkbox" bind:checked={formSpec.isActive} /> Activa
			</label>
			<div class="sm:col-span-2 rounded border border-slate-100 bg-slate-50 px-3 py-2">
				<p class="mb-1 font-medium text-slate-700">Unidades alternativas</p>
				<p class="mb-2 text-xs text-slate-500">
					Aceptadas al evaluar el RFP (además de la principal). No incluye la unidad principal.
				</p>
				<div class="flex flex-wrap gap-x-4 gap-y-1">
					{#each units.filter((u) => String(u._id) !== String(formSpec.unitId || '')) as u}
						<label class="flex items-center gap-1.5 text-xs">
							<input
								type="checkbox"
								checked={formSpec.altUnitIds.includes(String(u._id))}
								onchange={() => toggleAltUnit(u._id)}
							/>
							{u.symbol} · {u.name}
						</label>
					{/each}
				</div>
			</div>
			<textarea
				class="rounded border px-2 py-1.5 sm:col-span-2"
				rows="2"
				placeholder="Instrucciones IA (criterios de evaluación)"
				bind:value={formSpec.evaluationCriteria.instructions}
			></textarea>
			<input
				class="rounded border px-2 py-1.5 sm:col-span-2"
				placeholder="Sinónimos (separados por coma)"
				bind:value={formSpec.evaluationCriteria.synonyms}
			/>
			<textarea
				class="rounded border px-2 py-1.5 sm:col-span-2"
				rows="2"
				placeholder="Ejemplos de valores (uno por línea)"
				bind:value={formSpec.evaluationCriteria.examples}
			></textarea>
			<div class="flex flex-wrap gap-2 sm:col-span-2">
				<button type="submit" disabled={saving} class="rounded bg-slate-800 px-3 py-1.5 text-white disabled:opacity-50">
					{saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear'}
				</button>
				{#if editing}
					<button type="button" class="rounded border border-slate-300 px-3 py-1.5" onclick={cancelEdit}
						>Cancelar</button
					>
				{/if}
			</div>
		</form>

		<div class="flex flex-wrap gap-2 text-sm">
			<select class="rounded border px-2 py-1" bind:value={filterCat} onchange={load}>
				<option value="">Todas las categorías</option>
				{#each categories as c}
					<option value={c._id}>{c.name}</option>
				{/each}
			</select>
			<select class="rounded border px-2 py-1" bind:value={filterActive} onchange={load}>
				<option value="">Activas e inactivas</option>
				<option value="true">Activas</option>
				<option value="false">Inactivas</option>
			</select>
			<select class="rounded border px-2 py-1" bind:value={filterDataType} onchange={load}>
				<option value="">Todos los tipos</option>
				<option value="texto">texto</option>
				<option value="numerico">numérico</option>
				<option value="booleano">booleano</option>
			</select>
			<input class="rounded border px-2 py-1" placeholder="Buscar…" bind:value={q} />
			<button type="button" class="rounded border px-3 py-1" onclick={load}>Buscar</button>
		</div>

		{#if !specs.length}
			<Empty>No hay especificaciones con estos filtros.</Empty>
		{:else}
			<div class="table-scroll rounded-lg border border-slate-200 bg-white">
				<table class="min-w-full text-left text-sm">
					<thead class="bg-slate-50">
						<tr>
							<th class="px-3 py-2">Nombre</th>
							<th class="hidden px-3 py-2 sm:table-cell">Categoría</th>
							<th class="hidden px-3 py-2 md:table-cell">Unidad</th>
							<th class="hidden px-3 py-2 lg:table-cell">Tipo</th>
							<th class="px-3 py-2">Estado</th>
							<th class="px-3 py-2">Acciones</th>
						</tr>
					</thead>
					<tbody>
						{#each specs as s}
							<tr class="border-t {formSpec._id === s._id ? 'bg-[var(--brand-soft)]' : ''}">
								<td class="px-3 py-2">
									{s.name}
									<p class="text-xs text-slate-500 sm:hidden">{catName(s.categoryId)}</p>
								</td>
								<td class="hidden px-3 py-2 sm:table-cell">{catName(s.categoryId)}</td>
								<td class="hidden px-3 py-2 md:table-cell">
									{unitSym(s.unitId)}{#if altSyms(s)}
										<span class="text-slate-400"> (+{altSyms(s)})</span>{/if}
								</td>
								<td class="hidden px-3 py-2 lg:table-cell">{s.dataType || '—'}</td>
								<td class="px-3 py-2">{s.isActive ? 'activa' : 'inactiva'}</td>
								<td class="px-3 py-2">
									<div class="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-2">
										<button type="button" class="tap-target text-left underline text-[var(--brand)]" onclick={() => startEdit(s)}
											>Editar</button
										>
										<button type="button" class="tap-target text-left underline" onclick={() => toggleSpec(s)}
											>{s.isActive ? 'Desactivar' : 'Activar'}</button
										>
										<button type="button" class="tap-target text-left underline" onclick={() => duplicate(s)}
											>Duplicar</button
										>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{:else if tab === 'cats'}
		<form class="grid gap-2 rounded-lg border bg-white p-4 text-sm sm:grid-cols-2" onsubmit={saveCategory}>
			<p class="font-medium text-slate-800 sm:col-span-2">
				{editingCat ? 'Editar categoría' : 'Nueva categoría'}
			</p>
			<input class="rounded border px-2 py-1.5" placeholder="Nombre *" bind:value={formCat.name} required />
			<label class="flex items-center gap-2">
				<input type="checkbox" bind:checked={formCat.isArchitectural} /> Arquitectónica
			</label>
			<textarea
				class="rounded border px-2 py-1.5 sm:col-span-2"
				rows="2"
				placeholder="Descripción"
				bind:value={formCat.description}
			></textarea>
			<div class="flex flex-wrap gap-2 sm:col-span-2">
				<button type="submit" class="rounded bg-slate-800 px-3 py-1.5 text-white">
					{editingCat ? 'Guardar cambios' : 'Crear'}
				</button>
				{#if editingCat}
					<button type="button" class="rounded border border-slate-300 px-3 py-1.5" onclick={cancelEditCat}
						>Cancelar</button
					>
				{/if}
			</div>
		</form>
		<p class="text-xs text-slate-500">Usa ↑ ↓ para cambiar el orden de visualización del checklist.</p>
		<ul class="space-y-2 text-sm">
			{#each [...categories].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)) as c, idx}
				<li
					class="flex flex-wrap items-center justify-between gap-2 rounded border bg-white px-3 py-2 {formCat._id ===
					c._id
						? 'bg-[var(--brand-soft)]'
						: ''}"
				>
					<div>
						<p>
							{c.displayOrder}. {c.name} {c.isArchitectural ? '(arq.)' : ''} · {c.isActive
								? 'activa'
								: 'inactiva'}
						</p>
						{#if c.description}
							<p class="text-xs text-slate-500">{c.description}</p>
						{/if}
					</div>
					<div class="flex flex-wrap items-center gap-2">
						<button
							type="button"
							class="underline text-[var(--brand)]"
							onclick={() => startEditCat(c)}>Editar</button
						>
						<button
							type="button"
							class="rounded border border-slate-300 px-2 py-0.5 disabled:opacity-30"
							disabled={idx === 0}
							title="Subir"
							onclick={() => moveCategory(c, 'up')}>↑</button
						>
						<button
							type="button"
							class="rounded border border-slate-300 px-2 py-0.5 disabled:opacity-30"
							disabled={idx === categories.length - 1}
							title="Bajar"
							onclick={() => moveCategory(c, 'down')}>↓</button
						>
						<button
							type="button"
							class="underline"
							onclick={async () => {
								await api.checklist.patchCategory(c._id, { isActive: !c.isActive });
								await load();
							}}>{c.isActive ? 'Desactivar' : 'Activar'}</button
						>
					</div>
				</li>
			{/each}
		</ul>
	{:else if tab === 'units'}
		<form class="flex flex-wrap gap-2 rounded-lg border bg-white p-4 text-sm" onsubmit={addUnit}>
			<input class="rounded border px-2 py-1.5" placeholder="Nombre" bind:value={newUnit.name} required />
			<input class="rounded border px-2 py-1.5" placeholder="Símbolo" bind:value={newUnit.symbol} required />
			<input class="rounded border px-2 py-1.5" placeholder="Tipo" bind:value={newUnit.measurementType} />
			<button type="submit" class="rounded bg-slate-800 px-3 py-1.5 text-white">Crear</button>
		</form>
		<ul class="space-y-1 text-sm">
			{#each units as u}
				<li class="rounded border bg-white px-3 py-2">{u.name} ({u.symbol}) · {u.measurementType}</li>
			{/each}
		</ul>
	{:else}
		{#if !changes.length}
			<Empty>Sin cambios registrados en el checklist.</Empty>
		{:else}
			<ul class="max-h-[28rem] space-y-2 overflow-y-auto text-sm">
				{#each changes as ch}
					<li class="rounded border bg-white px-3 py-2">
						<strong>{ch.tipoCambio}</strong> · {ch.especificacionClave} · {ch.usuarioId} ·
						{new Date(ch.changedAt).toLocaleString('es-MX')}
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
{/if}
</section>
