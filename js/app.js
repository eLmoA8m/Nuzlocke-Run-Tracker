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
  updateStats();
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
    li.className = "p-3 hover:bg-[#00f5d4]/10 cursor-pointer capitalize text-gray-300 hover:text-[#00f5d4] transition-colors duration-200 border-b border-[#2d2d44] last:border-b-0";

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
      id: Date.now(),
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

  const statusClasses = {
    alive: 'status-alive',
    dead: 'status-dead',
    boxed: 'status-boxed'
  };

  const statusLabels = {
    alive: '● ALIVE',
    dead: '✕ DEAD',
    boxed: '▢ BOXED'
  };

  div.className = "bg-[#1a1a2e] border border-[#2d2d44] rounded-2xl p-5 text-center card-animate hover:border-[#00f5d4]/50 transition-all duration-300 group";

  div.innerHTML = `
    <div class="relative mb-3">
      <img src="${sprite}" class="w-24 mx-auto group-hover:scale-110 transition-transform duration-300" alt="${name}">
    </div>
    <h3 class="font-display font-bold text-lg text-white capitalize">${name}</h3>
    <p class="text-sm text-gray-400 mb-3">${routeName}</p>
    <span class="status text-sm font-semibold uppercase tracking-wider ${statusClasses[status]}">${statusLabels[status]}</span>
    
    <div class="flex gap-2 mt-4 justify-center">
      <select class="status-select bg-[#0d0d1a] border border-[#2d2d44] rounded px-2 py-1 text-xs text-gray-300">
        <option value="alive" ${status === 'alive' ? 'selected' : ''}>Alive</option>
        <option value="dead" ${status === 'dead' ? 'selected' : ''}>Dead</option>
        <option value="boxed" ${status === 'boxed' ? 'selected' : ''}>Boxed</option>
      </select>
      <button class="delete-btn bg-[#f72585]/20 text-[#f72585] border border-[#f72585]/50 px-3 py-1 rounded hover:bg-[#f72585] hover:text-white transition-all duration-300 text-xs">
        DELETE
      </button>
    </div>
  `;

  // EVENT: cambiar estado
  const selectStatus = div.querySelector('.status-select');
  selectStatus.addEventListener('change', (e) => {
    updateStatus(id, e.target.value);
    const span = div.querySelector('.status');
    span.className = `status text-sm font-semibold uppercase tracking-wider ${statusClasses[e.target.value]}`;
    span.textContent = statusLabels[e.target.value];
    updateStats();
  });

  // EVENT: eliminar
  const deleteBtn = div.querySelector('.delete-btn');
  deleteBtn.addEventListener('click', () => {
    deletePokemon(id, div);
  });

  cards.appendChild(div);
  updateStats();
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
  updateStats();
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
  updateStats();
}

function restoreRoute(routeId, routeName) {
  const option = document.createElement('option');
  option.value = routeId;
  option.textContent = routeName;

  select.appendChild(option);
}

// UPDATE STATS
function updateStats() {
  const total = savedData.length;
  const alive = savedData.filter(p => p.status === 'alive').length;
  const dead = savedData.filter(p => p.status === 'dead').length;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-alive').textContent = alive;
  document.getElementById('stat-dead').textContent = dead;
}