import { getHoennNames, getPokemonData } from './api.js';
import { getRoutes } from './routes-service.js';

const input = document.getElementById('pokemon');
const list = document.getElementById('pokemon-list');
const cards = document.getElementById('cards');
const select = document.getElementById('route');
const form = document.getElementById('form');
const statusSelect = document.getElementById('status');

let pokemonNames = [];

// INIT
init();

async function init() {
  try {
    pokemonNames = await getHoennNames();
    const routes = await getRoutes();
    fillRoutes(routes, select);
  } catch (error) {
    console.error(error);
  }
}

// LLENAR ROUTES
function fillRoutes(routes, select) {
  routes.forEach(route => {
    const option = document.createElement('option');
    option.value = route.id;
    option.textContent = route.name;

    select.appendChild(option);
  });
}

// INPUT EVENT (AUTOCOMPLETE)
input.addEventListener('input', () => {
  const value = input.value.toLowerCase();

  if (!value) {
    list.classList.add('hidden');
    return;
  }

  const filtered = pokemonNames.filter(name =>
    name.includes(value)
  );

  renderList(filtered.slice(0, 10));
});

// RENDER LISTA
function renderList(names) {
  list.innerHTML = '';

  if (names.length === 0) {
    list.classList.add('hidden');
    return;
  }

  names.forEach(name => {
    const li = document.createElement('li');
    li.textContent = name;
    li.className = "p-2 hover:bg-gray-100 cursor-pointer capitalize";

    li.addEventListener('click', () => {
      selectPokemon(name);
    });

    list.appendChild(li);
  });

  list.classList.remove('hidden');
}

// SELECCIONAR POKÉMON
function selectPokemon(name) {
  input.value = name;
  list.classList.add('hidden');
}

// SUBMIT FORM
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const routeId = select.value;
  const routeName = select.options[select.selectedIndex]?.text;
  const pokemonName = input.value.toLowerCase();
  const status = statusSelect.value;

  // VALIDACIONES
  if (!routeId || !pokemonName || !status) {
    alert('Complete all fields');
    return;
  }

  // Validar que sea de Hoenn
  if (!pokemonNames.includes(pokemonName)) {
    alert('Invalid Pokémon (must be Hoenn)');
    return;
  }

  try {
    const pokemon = await getPokemonData(pokemonName);

    renderCard({
      name: pokemon.name,
      sprite: pokemon.sprite,
      route: routeName,
      status
    });

    removeUsedRoute(routeId);

    form.reset();
    list.classList.add('hidden');

  } catch (error) {
    alert('Pokémon not found');
    console.error(error);
  }
});

// RENDER CARD
function renderCard({ name, sprite, route, status }) {
  const div = document.createElement('div');

  const statusColor = {
    alive: 'text-green-600',
    dead: 'text-red-600',
    boxed: 'text-gray-500'
  };

  div.className = "bg-white rounded-xl shadow p-4 text-center";

  div.innerHTML = `
    <img src="${sprite}" class="w-20 mx-auto mb-2">
    <h3 class="font-bold text-lg capitalize">${name}</h3>
    <p class="text-sm text-gray-500">${route}</p>
    <p class="text-sm font-semibold ${statusColor[status]} capitalize">${status}</p>
  `;

  cards.appendChild(div);
}

// ELIMINAR RUTA (REGLA NUZLOCKE)
function removeUsedRoute(routeId) {
  const option = select.querySelector(`option[value="${routeId}"]`);
  if (option) option.remove();
}