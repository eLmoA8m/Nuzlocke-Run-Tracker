
export async function getHoennNames() {
  const res = await fetch(
    "https://pokeapi.co/api/v2/pokemon?limit=135&offset=251"
  );

  const data = await res.json();

  return data.results.map(p => p.name);
}

export async function getPokemonData(name) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
  const data = await res.json();

  return {
    name: data.name,
    sprite: data.sprites.front_default
  };
}