const API = 'https://pokeapi.co/api/v2';
const list = document.querySelector('.list');
const data = document.querySelector('.data');

const paginationData = {
  limit: 15,
  pagesShown: 3,
  pageCurrent: 0,
};

// const likesFromLocalStorage = {};

let pages;

const API_URL = `${API}/pokemon/?limit=${paginationData.limit}`;

const pagination = document.querySelector('.pagination');
const modalData = document.querySelector('.modal-data');
const modalContainer = document.querySelector('[data-modal-container]');
const btnCloseModal = document.querySelector('[data-close-modal]');

const fetchPokemons = async (url = API_URL) => {
  const res = await fetch(`${url}`);
  try {
    if (!res.ok) {
      throw new Error('Something went wrong...');
    }
    const pokemons = await res.json();
    displayList(pokemons);

    if (pages === undefined) {
      const { count } = pokemons;
      pages = count;
      pages = getPagesAmount(count, paginationData);
    }
    pagination.innerHTML = displayPages(pokemons);
  } catch (error) {
    console.log(error);
  }
};

fetchPokemons();

const getFromLocalStorage = () => {
  const likedPokemons = localStorage.getItem('likedPokemons');
  if (likedPokemons === null) {
    return [];
  }
  return JSON.parse(likedPokemons);
};

const setToLocalStorage = (pokemon) => {
  const { id, name } = pokemon;
  const existingPokemons = getFromLocalStorage();
  const isAlreadyLiked = existingPokemons.find((pokemon) => pokemon.id === id);

  let likedPokemonsUpdated;

  if (isAlreadyLiked) {
    likedPokemonsUpdated = existingPokemons.filter(
      (pokemon) => pokemon.id !== id
    );
  } else {
    likedPokemonsUpdated = [...existingPokemons, { id, name }];
  }
  localStorage.setItem('likedPokemons', JSON.stringify(likedPokemonsUpdated));
};

const handleLike = (id, name) => {
  const likeBtn = document.querySelector(`[data-id="${id}"]`);
  likeBtn.classList.toggle('fa-solid');

  const parent = likeBtn.closest('.data');
  const cirlce = parent.querySelector('.data__image-circle');

  const card = document.querySelector(`[data-name="${id}-${name}"]`);
  card.classList.toggle('liked-background');

  cirlce.classList.toggle('liked-background');

  const cardLike = card.querySelector('i');
  cardLike.classList.toggle('hidden');

  setToLocalStorage({ id, name });
};

const isLiked = (id) => {
  const likedPokemons = getFromLocalStorage();
  const isLiked = likedPokemons.find((pokemon) => pokemon.id === id);
  return isLiked === undefined ? false : true;
};

const getPagesAmount = (pokemonAmount, paginationData) => {
  const { limit } = paginationData;
  return Math.floor(pokemonAmount / limit) + 1;
};

const parseUrl = (url) => {
  if (url !== null) {
    return parseInt(url.split('?')[1].split('&')[0].split('=')[1], 10);
  }
};

const displayPages = ({ previous, next }) => {
  let { pageCurrent, pagesShown, limit } = paginationData;
  let pagePrevious = '...';
  let pageNext;

  if (previous === null) {
    pageCurrent = 1;
    pageNext = pageCurrent + 1;
  }
  if (next === null) {
    pageCurrent = pages;
    pagePrevious = pages - 1;
  }

  const prevOffset = parseUrl(previous);
  const nextOffset = parseUrl(next);

  if (!isNaN(nextOffset - prevOffset)) {
    pageCurrent = nextOffset / limit;
    if (pageCurrent > 1 && pageCurrent <= pages - 1) {
      pagePrevious = pageCurrent - 1;
      pageNext = pageCurrent + 1;
    }
  }

  return `
    <button class="page-item prev-page pointer" ${
      previous === null ? 'disabled' : ''
    } 
    onClick='fetchPokemons("${API_URL}&offset=${prevOffset}")'><</button>
    <li class="page-item" style="display:${
      pageCurrent >= pagesShown ? 'block' : 'none'
    }">...</li>
    <button class="page-item pointer" style="display:${
      !isNaN(pagePrevious) ? 'block' : 'none'
    }"
    onClick='fetchPokemons("${API_URL}&offset=${prevOffset}")'
    >${pagePrevious}</button>

    <button class="page-item page-active no-pointer" >${pageCurrent}</button>
    
    <button class="page-item pointer" style="display:${
      !isNaN(pageNext) ? 'block' : 'none'
    }" onClick='fetchPokemons("${API_URL}&offset=${nextOffset}")'>${pageNext}</button>
    <li class="page-item" style="display:${
      pageCurrent <= pages - pagesShown + 1 ? 'block' : 'none'
    }"
    >...</li>
    <button class="page-item next-page pointer" ${
      next === null ? 'disabled' : ''
    } 
    onClick='fetchPokemons("${API_URL}&offset=${nextOffset}")'>></button>
  `;
};

const displayList = async ({ results }) => {
  list.innerHTML = results
    .map(({ url, name }) => {
      // const id = url.split('/')[6];
      // console.log(id);
      // const pokemonURL = `https://pokeapi.co/api/v2/pokemon/${id}`;
      // const name = 'test';

      const id = Number(url.split('/')[6]);
      return `
      <div class="list__item ${
        isLiked(id) ? `liked-background` : ''
      }" onClick="fetchPokemonData('${url}')" data-name="${id}-${name}">
        <div>${name}</div>
        <i class="fa-solid fa-heart card-like ${
          isLiked(id) ? '' : 'hidden'
        }"></i>
      </div>
    `;
    })
    .join('');
};

const fetchPokemonData = async (url) => {
  const res = await fetch(url);
  const pokemon = await res.json();

  data.innerHTML = displayPokemonData(pokemon);
};

const getEvolutions = ({ evolves_to }, evolutions = []) => {
  if (evolves_to.length !== 0) {
    const nextChain = evolves_to[0];
    const { name, url } = evolves_to[0].species;
    const species = [...evolutions, { name, url }];
    return getEvolutions(nextChain, species);
  }

  return evolutions;
};

const fetchEvolutions = async (id) => {
  const URL = `${API}/pokemon-species/${id}`;

  const res = await fetch(`${URL}`);

  try {
    if (!res.ok) {
      throw new Error('Something went wrong...');
    }

    const { evolution_chain } = await res.json();
    const evolutionRes = await fetch(evolution_chain.url);
    const pokemons = await evolutionRes.json();
    const evolutionArray = getEvolutions(pokemons.chain);
    handleEvolutions(evolutionArray);
  } catch (error) {
    console.log(error);
  }
};

const handleEvolutions = (evolutions) => {
  modalData.innerHTML = '';

  const promises = [];

  evolutions.forEach((evolution) => {
    const url = `${API}/pokemon/${evolution.name}`;
    promises.push(fetch(url).then((res) => res.json()));
  });

  Promise.all(promises).then((res) => {
    res.map((pokemon) => {
      const { name } = pokemon;
      const { front_default: img } = pokemon.sprites.other.dream_world;
      modalData.innerHTML += `
      <h3>${name}</h3>
      <div class='data__image'>
        <img src='${img}' />
      </div>
      `;
    });
  });
};

const openModal = (id) => {
  modalData.innerHTML = '';
  fetchEvolutions(id);
  modalContainer.style.display = 'block';
};

const closeModal = () => {
  modalContainer.style.display = 'none';
};

modalContainer.addEventListener('click', (e) => {
  const target = e.target;

  if (
    target.dataset.modalContainer === '' ||
    target.dataset.closeModal === ''
  ) {
    closeModal();
  }
});

const displayPokemonData = (pokemon) => {
  const { sprites, stats, id, name } = pokemon;
  const { front_default: img } = sprites.other.dream_world;
  return ` 
    <div class='data__image'>
      <div class='data__image-circle ${
        isLiked(id) ? 'liked-background' : ''
      }'></div>
      <img src='${img}'/>
    </div>
    <h3>
      <span class="data__id">#${id}</span>
      <span class="data__name">${name}</span>
      <i class="fa-regular ${
        isLiked(id) ? 'fa-solid' : ''
      } fa-heart like" onClick="handleLike(${id}, '${name}')" data-id=${id}></i>
    </h3>
    <div class='stats'>
      ${stats
        .map((item) => {
          return `
            <div class='stats__item'>    
              <p>${item.stat.name}</p>
              <span>${item.base_stat}</span>
            </div>
            `;
        })
        .join('')}
    </div>
    <div class='evolutions'><button type="button" onClick="openModal(${id})">Click to see the evolutions</button></div>
  `;
};
