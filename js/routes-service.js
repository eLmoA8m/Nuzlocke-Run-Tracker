// api.js

export async function getRoutes() {
  const res = await fetch('./data/routes.json');

  if (!res.ok) {
    throw new Error('Error cargando rutas');
  }

  return await res.json();
}
