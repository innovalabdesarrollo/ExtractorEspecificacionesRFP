import { redirect } from '@sveltejs/kit';

/** Enlaces viejos `?vista=arquitecto` → ruta dedicada */
export function load({ url, params }) {
	if (url.searchParams.get('vista') === 'arquitecto') {
		throw redirect(307, `/arquitecto/${params.id}`);
	}
	return {};
}
