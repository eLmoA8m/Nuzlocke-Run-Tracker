import { getHoennNames, getPokemonData } from './api.js';
import { getRoutes } from './routes-service.js';

const input = document.getElementById('pokemon');
const list = document.getElementById('pokemon-list');
const cards = document.getElementById('cards');
const select = document.getElementById('route');
const form = document.getElementById('form');
const statusSelect = document.getElementById('status');

let pokemonNames = [];
let savedData = [];

// ===== LOCAL STORAGE =====
const STORAGE_KEY = 'nuzlocke-data';

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));
}

function loadFromStorage() {
  const data = localStorage.getItem(STORAGE_KEY);
  savedData = data ? JSON.parse(data) : [];
}

// INIT
init();

async function init() {
  try {
    pokemonNames = await getHoennNames();
    const routes = await getRoutes();

    loadFromStorage();

    fillRoutes(routes, select);
    restoreState();

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

// RESTAURAR ESTADO
function restoreState() {
  savedData.forEach(entry => {
    renderCard(entry);
    removeUsedRoute(entry.routeId);
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

  if (!pokemonNames.includes(pokemonName)) {
    alert('Invalid Pokémon (must be Hoenn)');
    return;
  }

  try {
    const pokemon = await getPokemonData(pokemonName);

    const entry = {
      routeId,
      routeName,
      name: pokemon.name,
      sprite: pokemon.sprite,
      status
    };

    // GUARDAR EN MEMORIA
    savedData.push(entry);

    // GUARDAR EN STORAGE
    saveToStorage();

    // RENDER
    renderCard(entry);

    // ELIMINAR RUTA
    removeUsedRoute(routeId);

    form.reset();
    list.classList.add('hidden');

  } catch (error) {
    alert('Pokémon not found');
    console.error(error);
  }
});

// RENDER CARD
function renderCard({id, name, sprite, routeName, status }) {
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
    <p class="text-sm text-gray-500">${routeName}</p>

    <select class="status-select border rounded p-1 mt-2">
      <option value="alive" ${status === 'alive' ? 'selected' : ''}>Alive</option>
      <option value="dead" ${status === 'dead' ? 'selected' : ''}>Dead</option>
      <option value="boxed" ${status === 'boxed' ? 'selected' : ''}>Boxed</option>
    </select>

    <button class="delete-btn mt-3 bg-red-500 text-white px-3 py-1 rounded">
      Delete
    </button>
  `;

    // EVENT: cambiar estado
  const selectStatus = div.querySelector('.status-select');
  selectStatus.addEventListener('change', (e) => {
    updateStatus(id, e.target.value);
  });

  // EVENT: eliminar
  const deleteBtn = div.querySelector('.delete-btn');
  deleteBtn.addEventListener('click', () => {
    deletePokemon(id, div);
  });


  cards.appendChild(div);
}

// ELIMINAR RUTA
function removeUsedRoute(routeId) {
  const option = select.querySelector(`option[value="${routeId}"]`);
  if (option) option.remove();
}

// ACTUALIZAR ESTADO
function updateStatus(id, newStatus) {
  const pokemon = savedData.find(p => p.id === id);

  if (!pokemon) return;

  pokemon.status = newStatus;

  saveToStorage();
}

// ELIMINAR POKÉMON
function deletePokemon(id, cardElement) {
  const pokemon = savedData.find(p => p.id === id);

  if (!pokemon) return;

  // restaurar ruta
  restoreRoute(pokemon.routeId, pokemon.routeName);

  // eliminar del array
  savedData = savedData.filter(p => p.id !== id);

  saveToStorage();

  cardElement.remove();
}

function restoreRoute(routeId, routeName) {
  const option = document.createElement('option');
  option.value = routeId;
  option.textContent = routeName;

  select.appendChild(option);
}