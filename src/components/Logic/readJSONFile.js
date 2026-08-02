export default async function readJSONFile(
    url,
    fetchImplementation = globalThis.fetch,
) {
    if (typeof fetchImplementation !== 'function') {
        throw new Error('This browser cannot load JSON data.');
    }

    const response = await fetchImplementation(url);

    if (!response.ok) {
        throw new Error(`Unable to load ${url} (HTTP ${response.status}).`);
    }

    return response.json();
}
