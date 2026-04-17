// Traer a pokemones por área: 

async function getEncountersByAreaId(areaId) {
  const res = await fetch(`https://pokeapi.co/api/v2/location-area/${areaId}/`);
  const data = await res.json();

  const encounters = data.pokemon_encounters
    .map(p => {
      const emerald = p.version_details.find(v => v.version.name === "emerald");
      if (!emerald) return null;

      return {
        name: p.pokemon.name,
        encounters: emerald.encounter_details.map(d => ({
          method: d.method.name,
          min_level: d.min_level,
          max_level: d.max_level,
          chance: d.chance
        }))
      };
    })
    .filter(Boolean);

  return encounters;
}

getEncountersByAreaId(393).then(data => console.log(data));

/* 
DEVUELVE: 
[
  {
    "name": "zigzagoon",
    "encounters": [
      {
        "method": "walk",
        "min_level": 2,
        "max_level": 3,
        "chance": 30
      }
    ]
  }
]
*/


// traer todas las rutas con ID y nombre:

(async () => {
  const res = await fetch("https://pokeapi.co/api/v2/location-area?limit=2000");
  const data = await res.json();

  const urls = data.results.map(r => r.url);

  const chunks = [];
  for (let i = 0; i < urls.length; i += 20) {
    chunks.push(urls.slice(i, i + 20));
  }

  const results = await Promise.all(
    chunks.map(chunk =>
      Promise.all(chunk.map(url => fetch(url).then(r => r.json())))
    )
  );

  const routes = [];

  for (const group of results) {
    for (const area of group) {
      const hasEmerald = area.pokemon_encounters.some(p =>
        p.version_details.some(v => v.version.name === "emerald")
      );

      if (hasEmerald) {
        const id = area.id; // 👈 AQUÍ está el ID
        routes.push({
          id,
          name: area.name
        });
      }
    }
  }

  console.log(routes);
})();

// Traer todas las evos de un pokemon:
// https://pokeapi.co/api/v2/evolution-chain/65/ Basarnos de aca para traer las evoluciones de un pokemon específico.

async function getEvolutions(pokemon) {
  const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemon}`);
  const speciesData = await speciesRes.json();

  const evoRes = await fetch(speciesData.evolution_chain.url);
  const evoData = await evoRes.json();

  const result = [];

  function traverse(chain) {
    result.push(chain.species.name);
    chain.evolves_to.forEach(traverse);
  }

  traverse(evoData.chain);
  return result;
}

getEvolutions("abra").then(console.log);

// Todos los ataques de un pokemon:

const res = await fetch("https://pokeapi.co/api/v2/pokemon/abra");
const data = await res.json();

const moves = data.moves
  .flatMap(m => 
    m.version_group_details.map(v => ({
      name: m.move.name,
      level: v.level_learned_at,
      method: v.move_learn_method.name,
      version: v.version_group.name
    }))
  )
  .filter(m =>
    m.method === "level-up" &&
    (m.version === "emerald" || m.version === "ruby-sapphire")
  )
  .sort((a, b) => a.level - b.level);

console.log(moves);
