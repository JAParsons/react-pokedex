import axios from 'axios';
import {
  getPokemonList,
  getPokemon,
  getCacheItem,
  setCacheItem,
  transformPokemonResponse
} from './api-adapter';
import {
  RequestError,
  ResponseError,
  ParsingError,
  UnknownError
} from './errors';

jest.mock('axios');

describe('fetch a list of Pokemon', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('fetches a list of Pokemon', async () => {
    // Arrange
    axios.get.mockImplementation(() => Promise.resolve(DEFAULT_POKEMON_LIST));

    // Act
    const response = await getPokemonList({});

    // Assert
    expect(response).toHaveProperty('count');
    expect(response).toHaveProperty('next');
    expect(response).toHaveProperty('previous');
    expect(response).toHaveProperty('results');
    expect(response.results).not.toBeNull();
  });

  it('fetches the next 20 Pokemon when the offset is 20', async () => {
    // Arrange
    axios.get.mockImplementation(() =>
      Promise.resolve(DEFAULT_POKEMON_LIST_OFFSET_20)
    );

    // Act
    const { results: pokemonList } = await getPokemonList({ offset: 20 });

    // Assert
    expect(pokemonList.length).toBe(20);
    expect(pokemonList[0].name).toBe('spearow');
    expect(pokemonList[pokemonList.length - 1].name).toBe('wigglytuff');
  });

  it('fetches the first 100 Pokemon', async () => {
    // Arrange
    axios.get.mockImplementation(() => Promise.resolve(POKEMON_LIST_LIMIT_100));

    // Act
    const { results: pokemonList } = await getPokemonList({});

    // Assert
    expect(pokemonList.length).toBe(100);
  });

  it('fetches the next 3 Pokemon when the offset is 3', async () => {
    // Arrange
    axios.get.mockImplementation(() =>
      Promise.resolve(POKEMON_LIST_OFFSET_3_LIMIT_3)
    );

    // Act
    const { results: pokemonList } = await getPokemonList({
      offset: 3,
      limit: 3
    });

    // Assert
    expect(pokemonList.length).toBe(3);
    expect(pokemonList[0].name).toBe('charmander');
    expect(pokemonList[pokemonList.length - 1].name).toBe('charizard');
  });
});

describe('fetches an individual Pokemon', () => {
  beforeEach(() => {
    // Arrange
    localStorage.clear();
    axios.get.mockImplementation(() => Promise.resolve(POKEMON));
  });

  it('fetches a Pokemon', async () => {
    // Act
    const pokemon = await getPokemon({ query: 25 });

    // Assert
    expect(pokemon).toHaveProperty('id');
    expect(pokemon).toHaveProperty('name');
    expect(pokemon).toHaveProperty('height');
    expect(pokemon).toHaveProperty('weight');
    expect(pokemon).toHaveProperty('types');
    expect(pokemon).toHaveProperty('image');
  });

  it('fetches a Pokemon by ID', async () => {
    // Act
    const pokemon = await getPokemon({ query: 1 });

    // Assert
    expect(pokemon.id).toBe(1);
  });

  it('fetches a Pokemon by name', async () => {
    // Act
    const pokemon = await getPokemon({ query: 'bulbasaur' });

    // Assert
    expect(pokemon.name).toBe('bulbasaur');
  });
});

describe('cache responses', () => {
  beforeEach(() => {
    // Arrange
    localStorage.clear();
    axios.get.mockImplementation(() => Promise.resolve(POKEMON));
  });

  it('adds an individual Pokemon to the cache', async () => {
    // Arrange
    const cache = {};

    // Act
    await getPokemon({ query: 25, cache });
    const cachedPokemon = getCacheItem({ key: '25', cache });

    // Assert
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(cachedPokemon).toEqual(POKEMON);
  });

  it('fetches an individual Pokemon from the cache', async () => {
    // Arrange
    const cache = {};
    setCacheItem({ key: '25', value: POKEMON, cache });

    // Act
    await getPokemon({ query: 25, cache });
    const cachedPokemon = getCacheItem({ key: '25', cache });

    // Assert
    expect(axios.get).toHaveBeenCalledTimes(0);
    expect(cachedPokemon).toEqual(POKEMON);
  });
});

describe('error handling', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns a ResponseError if the API throws a 404', async () => {
    // Arrange
    axios.get.mockImplementation(() =>
      Promise.reject({ response: { status: 404 } })
    );

    // Act
    const response = await getPokemon({ query: 'totallyNotARealPokemon' });

    // Assert
    expect(response).toBeInstanceOf(ResponseError);
    expect(response.message).toBe('ResponseError - Client received a 404');
  });

  it('returns a ResponseError if the API throws a 500', async () => {
    // Arrange
    axios.get.mockImplementation(() =>
      Promise.reject({ response: { status: 500 } })
    );

    // Act
    const response = await getPokemon({ query: 'totallyNotARealPokemon' });

    // Assert
    expect(response).toBeInstanceOf(ResponseError);
    expect(response.message).toBe('ResponseError - Client received a 500');
  });

  it('returns a RequestError if the request fails to send', async () => {
    // Arrange
    axios.get.mockImplementation(() => Promise.reject({ request: {} }));

    // Act
    const response = await getPokemon({ query: 'bulbasaur' });

    // Assert
    expect(response).toBeInstanceOf(RequestError);
    expect(response.message).toBe('RequestError - Request failed to send');
  });

  it('returns a ParsingError if the response cannot be parsed', async () => {
    // Arrange
    axios.get.mockImplementation(() => Promise.resolve({ unparsable: {} }));

    // Act
    const response = await getPokemon({ query: 'bulbasaur' });

    // Assert
    expect(response).toBeInstanceOf(ParsingError);
    expect(response.message).toBe('ParsingError - Failed to parse response');
  });

  it('returns a UnknownError if an unexpected response is received', async () => {
    // Arrange
    axios.get.mockImplementation(() => Promise.reject({ unexpected: {} }));

    // Act
    const response = await getPokemon({ query: 'bulbasaur' });

    // Assert
    expect(response).toBeInstanceOf(UnknownError);
    expect(response.message).toBe(
      'UnknownError - Something went wrong when processing the request'
    );
  });
});

describe('response transformations', () => {
  it('transforms the response for an individual Pokemon', () => {
    // Act
    const transformedPokemon = transformPokemonResponse({ response: POKEMON });

    // Assert
    expect(transformedPokemon).toBeInstanceOf(Object);
    expect(transformedPokemon).toHaveProperty('id');
    expect(transformedPokemon).toHaveProperty('name');
    expect(transformedPokemon).toHaveProperty('height');
    expect(transformedPokemon).toHaveProperty('weight');
    expect(transformedPokemon).toHaveProperty('types');
    expect(transformedPokemon.types).toBeInstanceOf(Array);
    expect(transformedPokemon).toHaveProperty('image');
  });
});

const DEFAULT_POKEMON_LIST = {
  data: {
    count: 1118,
    next: 'https://pokeapi.co/api/v2/pokemon/?offset=20&limit=20',
    previous: null,
    results: [
      {
        name: 'bulbasaur',
        url: 'https://pokeapi.co/api/v2/pokemon/1/'
      },
      {
        name: 'ivysaur',
        url: 'https://pokeapi.co/api/v2/pokemon/2/'
      },
      {
        name: 'venusaur',
        url: 'https://pokeapi.co/api/v2/pokemon/3/'
      },
      {
        name: 'charmander',
        url: 'https://pokeapi.co/api/v2/pokemon/4/'
      },
      {
        name: 'charmeleon',
        url: 'https://pokeapi.co/api/v2/pokemon/5/'
      },
      {
        name: 'charizard',
        url: 'https://pokeapi.co/api/v2/pokemon/6/'
      },
      {
        name: 'squirtle',
        url: 'https://pokeapi.co/api/v2/pokemon/7/'
      },
      {
        name: 'wartortle',
        url: 'https://pokeapi.co/api/v2/pokemon/8/'
      },
      {
        name: 'blastoise',
        url: 'https://pokeapi.co/api/v2/pokemon/9/'
      },
      {
        name: 'caterpie',
        url: 'https://pokeapi.co/api/v2/pokemon/10/'
      },
      {
        name: 'metapod',
        url: 'https://pokeapi.co/api/v2/pokemon/11/'
      },
      {
        name: 'butterfree',
        url: 'https://pokeapi.co/api/v2/pokemon/12/'
      },
      {
        name: 'weedle',
        url: 'https://pokeapi.co/api/v2/pokemon/13/'
      },
      {
        name: 'kakuna',
        url: 'https://pokeapi.co/api/v2/pokemon/14/'
      },
      {
        name: 'beedrill',
        url: 'https://pokeapi.co/api/v2/pokemon/15/'
      },
      {
        name: 'pidgey',
        url: 'https://pokeapi.co/api/v2/pokemon/16/'
      },
      {
        name: 'pidgeotto',
        url: 'https://pokeapi.co/api/v2/pokemon/17/'
      },
      {
        name: 'pidgeot',
        url: 'https://pokeapi.co/api/v2/pokemon/18/'
      },
      {
        name: 'rattata',
        url: 'https://pokeapi.co/api/v2/pokemon/19/'
      },
      {
        name: 'raticate',
        url: 'https://pokeapi.co/api/v2/pokemon/20/'
      }
    ]
  }
};

const DEFAULT_POKEMON_LIST_OFFSET_20 = {
  data: {
    count: 1118,
    next: 'https://pokeapi.co/api/v2/pokemon/?offset=40&limit=20',
    previous: 'https://pokeapi.co/api/v2/pokemon/?offset=0&limit=20',
    results: [
      {
        name: 'spearow',
        url: 'https://pokeapi.co/api/v2/pokemon/21/'
      },
      {
        name: 'fearow',
        url: 'https://pokeapi.co/api/v2/pokemon/22/'
      },
      {
        name: 'ekans',
        url: 'https://pokeapi.co/api/v2/pokemon/23/'
      },
      {
        name: 'arbok',
        url: 'https://pokeapi.co/api/v2/pokemon/24/'
      },
      {
        name: 'pikachu',
        url: 'https://pokeapi.co/api/v2/pokemon/25/'
      },
      {
        name: 'raichu',
        url: 'https://pokeapi.co/api/v2/pokemon/26/'
      },
      {
        name: 'sandshrew',
        url: 'https://pokeapi.co/api/v2/pokemon/27/'
      },
      {
        name: 'sandslash',
        url: 'https://pokeapi.co/api/v2/pokemon/28/'
      },
      {
        name: 'nidoran-f',
        url: 'https://pokeapi.co/api/v2/pokemon/29/'
      },
      {
        name: 'nidorina',
        url: 'https://pokeapi.co/api/v2/pokemon/30/'
      },
      {
        name: 'nidoqueen',
        url: 'https://pokeapi.co/api/v2/pokemon/31/'
      },
      {
        name: 'nidoran-m',
        url: 'https://pokeapi.co/api/v2/pokemon/32/'
      },
      {
        name: 'nidorino',
        url: 'https://pokeapi.co/api/v2/pokemon/33/'
      },
      {
        name: 'nidoking',
        url: 'https://pokeapi.co/api/v2/pokemon/34/'
      },
      {
        name: 'clefairy',
        url: 'https://pokeapi.co/api/v2/pokemon/35/'
      },
      {
        name: 'clefable',
        url: 'https://pokeapi.co/api/v2/pokemon/36/'
      },
      {
        name: 'vulpix',
        url: 'https://pokeapi.co/api/v2/pokemon/37/'
      },
      {
        name: 'ninetales',
        url: 'https://pokeapi.co/api/v2/pokemon/38/'
      },
      {
        name: 'jigglypuff',
        url: 'https://pokeapi.co/api/v2/pokemon/39/'
      },
      {
        name: 'wigglytuff',
        url: 'https://pokeapi.co/api/v2/pokemon/40/'
      }
    ]
  }
};

const POKEMON_LIST_LIMIT_100 = {
  data: {
    count: 1118,
    next: 'https://pokeapi.co/api/v2/pokemon/?offset=100&limit=100',
    previous: null,
    results: [
      {
        name: 'bulbasaur',
        url: 'https://pokeapi.co/api/v2/pokemon/1/'
      },
      {
        name: 'ivysaur',
        url: 'https://pokeapi.co/api/v2/pokemon/2/'
      },
      {
        name: 'venusaur',
        url: 'https://pokeapi.co/api/v2/pokemon/3/'
      },
      {
        name: 'charmander',
        url: 'https://pokeapi.co/api/v2/pokemon/4/'
      },
      {
        name: 'charmeleon',
        url: 'https://pokeapi.co/api/v2/pokemon/5/'
      },
      {
        name: 'charizard',
        url: 'https://pokeapi.co/api/v2/pokemon/6/'
      },
      {
        name: 'squirtle',
        url: 'https://pokeapi.co/api/v2/pokemon/7/'
      },
      {
        name: 'wartortle',
        url: 'https://pokeapi.co/api/v2/pokemon/8/'
      },
      {
        name: 'blastoise',
        url: 'https://pokeapi.co/api/v2/pokemon/9/'
      },
      {
        name: 'caterpie',
        url: 'https://pokeapi.co/api/v2/pokemon/10/'
      },
      {
        name: 'metapod',
        url: 'https://pokeapi.co/api/v2/pokemon/11/'
      },
      {
        name: 'butterfree',
        url: 'https://pokeapi.co/api/v2/pokemon/12/'
      },
      {
        name: 'weedle',
        url: 'https://pokeapi.co/api/v2/pokemon/13/'
      },
      {
        name: 'kakuna',
        url: 'https://pokeapi.co/api/v2/pokemon/14/'
      },
      {
        name: 'beedrill',
        url: 'https://pokeapi.co/api/v2/pokemon/15/'
      },
      {
        name: 'pidgey',
        url: 'https://pokeapi.co/api/v2/pokemon/16/'
      },
      {
        name: 'pidgeotto',
        url: 'https://pokeapi.co/api/v2/pokemon/17/'
      },
      {
        name: 'pidgeot',
        url: 'https://pokeapi.co/api/v2/pokemon/18/'
      },
      {
        name: 'rattata',
        url: 'https://pokeapi.co/api/v2/pokemon/19/'
      },
      {
        name: 'raticate',
        url: 'https://pokeapi.co/api/v2/pokemon/20/'
      },
      {
        name: 'spearow',
        url: 'https://pokeapi.co/api/v2/pokemon/21/'
      },
      {
        name: 'fearow',
        url: 'https://pokeapi.co/api/v2/pokemon/22/'
      },
      {
        name: 'ekans',
        url: 'https://pokeapi.co/api/v2/pokemon/23/'
      },
      {
        name: 'arbok',
        url: 'https://pokeapi.co/api/v2/pokemon/24/'
      },
      {
        name: 'pikachu',
        url: 'https://pokeapi.co/api/v2/pokemon/25/'
      },
      {
        name: 'raichu',
        url: 'https://pokeapi.co/api/v2/pokemon/26/'
      },
      {
        name: 'sandshrew',
        url: 'https://pokeapi.co/api/v2/pokemon/27/'
      },
      {
        name: 'sandslash',
        url: 'https://pokeapi.co/api/v2/pokemon/28/'
      },
      {
        name: 'nidoran-f',
        url: 'https://pokeapi.co/api/v2/pokemon/29/'
      },
      {
        name: 'nidorina',
        url: 'https://pokeapi.co/api/v2/pokemon/30/'
      },
      {
        name: 'nidoqueen',
        url: 'https://pokeapi.co/api/v2/pokemon/31/'
      },
      {
        name: 'nidoran-m',
        url: 'https://pokeapi.co/api/v2/pokemon/32/'
      },
      {
        name: 'nidorino',
        url: 'https://pokeapi.co/api/v2/pokemon/33/'
      },
      {
        name: 'nidoking',
        url: 'https://pokeapi.co/api/v2/pokemon/34/'
      },
      {
        name: 'clefairy',
        url: 'https://pokeapi.co/api/v2/pokemon/35/'
      },
      {
        name: 'clefable',
        url: 'https://pokeapi.co/api/v2/pokemon/36/'
      },
      {
        name: 'vulpix',
        url: 'https://pokeapi.co/api/v2/pokemon/37/'
      },
      {
        name: 'ninetales',
        url: 'https://pokeapi.co/api/v2/pokemon/38/'
      },
      {
        name: 'jigglypuff',
        url: 'https://pokeapi.co/api/v2/pokemon/39/'
      },
      {
        name: 'wigglytuff',
        url: 'https://pokeapi.co/api/v2/pokemon/40/'
      },
      {
        name: 'zubat',
        url: 'https://pokeapi.co/api/v2/pokemon/41/'
      },
      {
        name: 'golbat',
        url: 'https://pokeapi.co/api/v2/pokemon/42/'
      },
      {
        name: 'oddish',
        url: 'https://pokeapi.co/api/v2/pokemon/43/'
      },
      {
        name: 'gloom',
        url: 'https://pokeapi.co/api/v2/pokemon/44/'
      },
      {
        name: 'vileplume',
        url: 'https://pokeapi.co/api/v2/pokemon/45/'
      },
      {
        name: 'paras',
        url: 'https://pokeapi.co/api/v2/pokemon/46/'
      },
      {
        name: 'parasect',
        url: 'https://pokeapi.co/api/v2/pokemon/47/'
      },
      {
        name: 'venonat',
        url: 'https://pokeapi.co/api/v2/pokemon/48/'
      },
      {
        name: 'venomoth',
        url: 'https://pokeapi.co/api/v2/pokemon/49/'
      },
      {
        name: 'diglett',
        url: 'https://pokeapi.co/api/v2/pokemon/50/'
      },
      {
        name: 'dugtrio',
        url: 'https://pokeapi.co/api/v2/pokemon/51/'
      },
      {
        name: 'meowth',
        url: 'https://pokeapi.co/api/v2/pokemon/52/'
      },
      {
        name: 'persian',
        url: 'https://pokeapi.co/api/v2/pokemon/53/'
      },
      {
        name: 'psyduck',
        url: 'https://pokeapi.co/api/v2/pokemon/54/'
      },
      {
        name: 'golduck',
        url: 'https://pokeapi.co/api/v2/pokemon/55/'
      },
      {
        name: 'mankey',
        url: 'https://pokeapi.co/api/v2/pokemon/56/'
      },
      {
        name: 'primeape',
        url: 'https://pokeapi.co/api/v2/pokemon/57/'
      },
      {
        name: 'growlithe',
        url: 'https://pokeapi.co/api/v2/pokemon/58/'
      },
      {
        name: 'arcanine',
        url: 'https://pokeapi.co/api/v2/pokemon/59/'
      },
      {
        name: 'poliwag',
        url: 'https://pokeapi.co/api/v2/pokemon/60/'
      },
      {
        name: 'poliwhirl',
        url: 'https://pokeapi.co/api/v2/pokemon/61/'
      },
      {
        name: 'poliwrath',
        url: 'https://pokeapi.co/api/v2/pokemon/62/'
      },
      {
        name: 'abra',
        url: 'https://pokeapi.co/api/v2/pokemon/63/'
      },
      {
        name: 'kadabra',
        url: 'https://pokeapi.co/api/v2/pokemon/64/'
      },
      {
        name: 'alakazam',
        url: 'https://pokeapi.co/api/v2/pokemon/65/'
      },
      {
        name: 'machop',
        url: 'https://pokeapi.co/api/v2/pokemon/66/'
      },
      {
        name: 'machoke',
        url: 'https://pokeapi.co/api/v2/pokemon/67/'
      },
      {
        name: 'machamp',
        url: 'https://pokeapi.co/api/v2/pokemon/68/'
      },
      {
        name: 'bellsprout',
        url: 'https://pokeapi.co/api/v2/pokemon/69/'
      },
      {
        name: 'weepinbell',
        url: 'https://pokeapi.co/api/v2/pokemon/70/'
      },
      {
        name: 'victreebel',
        url: 'https://pokeapi.co/api/v2/pokemon/71/'
      },
      {
        name: 'tentacool',
        url: 'https://pokeapi.co/api/v2/pokemon/72/'
      },
      {
        name: 'tentacruel',
        url: 'https://pokeapi.co/api/v2/pokemon/73/'
      },
      {
        name: 'geodude',
        url: 'https://pokeapi.co/api/v2/pokemon/74/'
      },
      {
        name: 'graveler',
        url: 'https://pokeapi.co/api/v2/pokemon/75/'
      },
      {
        name: 'golem',
        url: 'https://pokeapi.co/api/v2/pokemon/76/'
      },
      {
        name: 'ponyta',
        url: 'https://pokeapi.co/api/v2/pokemon/77/'
      },
      {
        name: 'rapidash',
        url: 'https://pokeapi.co/api/v2/pokemon/78/'
      },
      {
        name: 'slowpoke',
        url: 'https://pokeapi.co/api/v2/pokemon/79/'
      },
      {
        name: 'slowbro',
        url: 'https://pokeapi.co/api/v2/pokemon/80/'
      },
      {
        name: 'magnemite',
        url: 'https://pokeapi.co/api/v2/pokemon/81/'
      },
      {
        name: 'magneton',
        url: 'https://pokeapi.co/api/v2/pokemon/82/'
      },
      {
        name: 'farfetchd',
        url: 'https://pokeapi.co/api/v2/pokemon/83/'
      },
      {
        name: 'doduo',
        url: 'https://pokeapi.co/api/v2/pokemon/84/'
      },
      {
        name: 'dodrio',
        url: 'https://pokeapi.co/api/v2/pokemon/85/'
      },
      {
        name: 'seel',
        url: 'https://pokeapi.co/api/v2/pokemon/86/'
      },
      {
        name: 'dewgong',
        url: 'https://pokeapi.co/api/v2/pokemon/87/'
      },
      {
        name: 'grimer',
        url: 'https://pokeapi.co/api/v2/pokemon/88/'
      },
      {
        name: 'muk',
        url: 'https://pokeapi.co/api/v2/pokemon/89/'
      },
      {
        name: 'shellder',
        url: 'https://pokeapi.co/api/v2/pokemon/90/'
      },
      {
        name: 'cloyster',
        url: 'https://pokeapi.co/api/v2/pokemon/91/'
      },
      {
        name: 'gastly',
        url: 'https://pokeapi.co/api/v2/pokemon/92/'
      },
      {
        name: 'haunter',
        url: 'https://pokeapi.co/api/v2/pokemon/93/'
      },
      {
        name: 'gengar',
        url: 'https://pokeapi.co/api/v2/pokemon/94/'
      },
      {
        name: 'onix',
        url: 'https://pokeapi.co/api/v2/pokemon/95/'
      },
      {
        name: 'drowzee',
        url: 'https://pokeapi.co/api/v2/pokemon/96/'
      },
      {
        name: 'hypno',
        url: 'https://pokeapi.co/api/v2/pokemon/97/'
      },
      {
        name: 'krabby',
        url: 'https://pokeapi.co/api/v2/pokemon/98/'
      },
      {
        name: 'kingler',
        url: 'https://pokeapi.co/api/v2/pokemon/99/'
      },
      {
        name: 'voltorb',
        url: 'https://pokeapi.co/api/v2/pokemon/100/'
      }
    ]
  }
};

const POKEMON_LIST_OFFSET_3_LIMIT_3 = {
  data: {
    count: 1118,
    next: 'https://pokeapi.co/api/v2/pokemon/?offset=6&limit=3',
    previous: 'https://pokeapi.co/api/v2/pokemon/?offset=0&limit=3',
    results: [
      {
        name: 'charmander',
        url: 'https://pokeapi.co/api/v2/pokemon/4/'
      },
      {
        name: 'charmeleon',
        url: 'https://pokeapi.co/api/v2/pokemon/5/'
      },
      {
        name: 'charizard',
        url: 'https://pokeapi.co/api/v2/pokemon/6/'
      }
    ]
  }
};

const POKEMON = {
  data: {
    abilities: [
      {
        ability: {
          name: 'overgrow',
          url: 'https://pokeapi.co/api/v2/ability/65/'
        },
        is_hidden: false,
        slot: 1
      },
      {
        ability: {
          name: 'chlorophyll',
          url: 'https://pokeapi.co/api/v2/ability/34/'
        },
        is_hidden: true,
        slot: 3
      }
    ],
    base_experience: 64,
    forms: [
      {
        name: 'bulbasaur',
        url: 'https://pokeapi.co/api/v2/pokemon-form/1/'
      }
    ],
    game_indices: [
      {
        game_index: 153,
        version: {
          name: 'red',
          url: 'https://pokeapi.co/api/v2/version/1/'
        }
      },
      {
        game_index: 153,
        version: {
          name: 'blue',
          url: 'https://pokeapi.co/api/v2/version/2/'
        }
      },
      {
        game_index: 153,
        version: {
          name: 'yellow',
          url: 'https://pokeapi.co/api/v2/version/3/'
        }
      },
      {
        game_index: 1,
        version: {
          name: 'gold',
          url: 'https://pokeapi.co/api/v2/version/4/'
        }
      },
      {
        game_index: 1,
        version: {
          name: 'silver',
          url: 'https://pokeapi.co/api/v2/version/5/'
        }
      },
      {
        game_index: 1,
        version: {
          name: 'crystal',
          url: 'https://pokeapi.co/api/v2/version/6/'
        }
      },
      {
        game_index: 1,
        version: {
          name: 'ruby',
          url: 'https://pokeapi.co/api/v2/version/7/'
        }
      },
      {
        game_index: 1,
        version: {
          name: 'sapphire',
          url: 'https://pokeapi.co/api/v2/version/8/'
        }
      },
      {
        game_index: 1,
        version: {
          name: 'emerald',
          url: 'https://pokeapi.co/api/v2/version/9/'
        }
      },
      {
        game_index: 1,
        version: {
          name: 'firered',
          url: 'https://pokeapi.co/api/v2/version/10/'
        }
      },
      {
        game_index: 1,
        version: {
          name: 'leafgreen',
          url: 'https://pokeapi.co/api/v2/version/11/'
        }
      },
      {
        game_index: 1,
        version: {
          name: 'diamond',
          url: 'https://pokeapi.co/api/v2/version/12/'
        }
      },
      {
        game_index: 1,
        version: {
          name: 'pearl',
          url: 'https://pokeapi.co/api/v2/version/13/'
        }
      },
      {
        game_index: 1,
        version: {
          name: 'platinum',
          url: 'https://pokeapi.co/api/v2/version/14/'
        }
      },
      {
        game_index: 1,
        version: {
          name: 'heartgold',
          url: 'https://pokeapi.co/api/v2/version/15/'
        }
      },
      {
        game_index: 1,
        version: {
          name: 'soulsilver',
          url: 'https://pokeapi.co/api/v2/version/16/'
        }
      },
      {
        game_index: 1,
        version: {
          name: 'black',
          url: 'https://pokeapi.co/api/v2/version/17/'
        }
      },
      {
        game_index: 1,
        version: {
          name: 'white',
          url: 'https://pokeapi.co/api/v2/version/18/'
        }
      },
      {
        game_index: 1,
        version: {
          name: 'black-2',
          url: 'https://pokeapi.co/api/v2/version/21/'
        }
      },
      {
        game_index: 1,
        version: {
          name: 'white-2',
          url: 'https://pokeapi.co/api/v2/version/22/'
        }
      }
    ],
    height: 7,
    held_items: [],
    id: 1,
    is_default: true,
    location_area_encounters: 'https://pokeapi.co/api/v2/pokemon/1/encounters',
    moves: [
      {
        move: {
          name: 'razor-wind',
          url: 'https://pokeapi.co/api/v2/move/13/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'gold-silver',
              url: 'https://pokeapi.co/api/v2/version-group/3/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'crystal',
              url: 'https://pokeapi.co/api/v2/version-group/4/'
            }
          }
        ]
      },
      {
        move: {
          name: 'swords-dance',
          url: 'https://pokeapi.co/api/v2/move/14/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'red-blue',
              url: 'https://pokeapi.co/api/v2/version-group/1/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'yellow',
              url: 'https://pokeapi.co/api/v2/version-group/2/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'cut',
          url: 'https://pokeapi.co/api/v2/move/15/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'red-blue',
              url: 'https://pokeapi.co/api/v2/version-group/1/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'yellow',
              url: 'https://pokeapi.co/api/v2/version-group/2/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'gold-silver',
              url: 'https://pokeapi.co/api/v2/version-group/3/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'crystal',
              url: 'https://pokeapi.co/api/v2/version-group/4/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ruby-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/5/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'colosseum',
              url: 'https://pokeapi.co/api/v2/version-group/12/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'xd',
              url: 'https://pokeapi.co/api/v2/version-group/13/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          }
        ]
      },
      {
        move: {
          name: 'bind',
          url: 'https://pokeapi.co/api/v2/move/20/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          }
        ]
      },
      {
        move: {
          name: 'vine-whip',
          url: 'https://pokeapi.co/api/v2/move/22/'
        },
        version_group_details: [
          {
            level_learned_at: 13,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'red-blue',
              url: 'https://pokeapi.co/api/v2/version-group/1/'
            }
          },
          {
            level_learned_at: 13,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'yellow',
              url: 'https://pokeapi.co/api/v2/version-group/2/'
            }
          },
          {
            level_learned_at: 10,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'gold-silver',
              url: 'https://pokeapi.co/api/v2/version-group/3/'
            }
          },
          {
            level_learned_at: 10,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'crystal',
              url: 'https://pokeapi.co/api/v2/version-group/4/'
            }
          },
          {
            level_learned_at: 10,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'ruby-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/5/'
            }
          },
          {
            level_learned_at: 10,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 10,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 9,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 9,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 9,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 9,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 10,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'colosseum',
              url: 'https://pokeapi.co/api/v2/version-group/12/'
            }
          },
          {
            level_learned_at: 10,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'xd',
              url: 'https://pokeapi.co/api/v2/version-group/13/'
            }
          },
          {
            level_learned_at: 9,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 9,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 9,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 7,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 9,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 9,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'headbutt',
          url: 'https://pokeapi.co/api/v2/move/29/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'gold-silver',
              url: 'https://pokeapi.co/api/v2/version-group/3/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'crystal',
              url: 'https://pokeapi.co/api/v2/version-group/4/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          }
        ]
      },
      {
        move: {
          name: 'tackle',
          url: 'https://pokeapi.co/api/v2/move/33/'
        },
        version_group_details: [
          {
            level_learned_at: 1,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'red-blue',
              url: 'https://pokeapi.co/api/v2/version-group/1/'
            }
          },
          {
            level_learned_at: 1,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'yellow',
              url: 'https://pokeapi.co/api/v2/version-group/2/'
            }
          },
          {
            level_learned_at: 1,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'gold-silver',
              url: 'https://pokeapi.co/api/v2/version-group/3/'
            }
          },
          {
            level_learned_at: 1,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'crystal',
              url: 'https://pokeapi.co/api/v2/version-group/4/'
            }
          },
          {
            level_learned_at: 1,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'ruby-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/5/'
            }
          },
          {
            level_learned_at: 1,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 1,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 1,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 1,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 1,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 1,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 1,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'colosseum',
              url: 'https://pokeapi.co/api/v2/version-group/12/'
            }
          },
          {
            level_learned_at: 1,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'xd',
              url: 'https://pokeapi.co/api/v2/version-group/13/'
            }
          },
          {
            level_learned_at: 1,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 1,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 1,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 1,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 1,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'body-slam',
          url: 'https://pokeapi.co/api/v2/move/34/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'red-blue',
              url: 'https://pokeapi.co/api/v2/version-group/1/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'yellow',
              url: 'https://pokeapi.co/api/v2/version-group/2/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'xd',
              url: 'https://pokeapi.co/api/v2/version-group/13/'
            }
          }
        ]
      },
      {
        move: {
          name: 'take-down',
          url: 'https://pokeapi.co/api/v2/move/36/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'red-blue',
              url: 'https://pokeapi.co/api/v2/version-group/1/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'yellow',
              url: 'https://pokeapi.co/api/v2/version-group/2/'
            }
          },
          {
            level_learned_at: 15,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 15,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 15,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 15,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 15,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 15,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 15,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 15,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 15,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'double-edge',
          url: 'https://pokeapi.co/api/v2/move/38/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'red-blue',
              url: 'https://pokeapi.co/api/v2/version-group/1/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'yellow',
              url: 'https://pokeapi.co/api/v2/version-group/2/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 27,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 27,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 27,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 27,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'xd',
              url: 'https://pokeapi.co/api/v2/version-group/13/'
            }
          },
          {
            level_learned_at: 27,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 27,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 27,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 27,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 27,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'growl',
          url: 'https://pokeapi.co/api/v2/move/45/'
        },
        version_group_details: [
          {
            level_learned_at: 1,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'red-blue',
              url: 'https://pokeapi.co/api/v2/version-group/1/'
            }
          },
          {
            level_learned_at: 1,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'yellow',
              url: 'https://pokeapi.co/api/v2/version-group/2/'
            }
          },
          {
            level_learned_at: 4,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'gold-silver',
              url: 'https://pokeapi.co/api/v2/version-group/3/'
            }
          },
          {
            level_learned_at: 4,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'crystal',
              url: 'https://pokeapi.co/api/v2/version-group/4/'
            }
          },
          {
            level_learned_at: 4,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'ruby-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/5/'
            }
          },
          {
            level_learned_at: 4,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 4,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 3,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 3,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 3,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 3,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 4,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'colosseum',
              url: 'https://pokeapi.co/api/v2/version-group/12/'
            }
          },
          {
            level_learned_at: 4,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'xd',
              url: 'https://pokeapi.co/api/v2/version-group/13/'
            }
          },
          {
            level_learned_at: 3,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 3,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 3,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 3,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 3,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'strength',
          url: 'https://pokeapi.co/api/v2/move/70/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ruby-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/5/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'colosseum',
              url: 'https://pokeapi.co/api/v2/version-group/12/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'xd',
              url: 'https://pokeapi.co/api/v2/version-group/13/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          }
        ]
      },
      {
        move: {
          name: 'mega-drain',
          url: 'https://pokeapi.co/api/v2/move/72/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'red-blue',
              url: 'https://pokeapi.co/api/v2/version-group/1/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'yellow',
              url: 'https://pokeapi.co/api/v2/version-group/2/'
            }
          }
        ]
      },
      {
        move: {
          name: 'leech-seed',
          url: 'https://pokeapi.co/api/v2/move/73/'
        },
        version_group_details: [
          {
            level_learned_at: 7,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'red-blue',
              url: 'https://pokeapi.co/api/v2/version-group/1/'
            }
          },
          {
            level_learned_at: 7,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'yellow',
              url: 'https://pokeapi.co/api/v2/version-group/2/'
            }
          },
          {
            level_learned_at: 7,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'gold-silver',
              url: 'https://pokeapi.co/api/v2/version-group/3/'
            }
          },
          {
            level_learned_at: 7,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'crystal',
              url: 'https://pokeapi.co/api/v2/version-group/4/'
            }
          },
          {
            level_learned_at: 7,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'ruby-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/5/'
            }
          },
          {
            level_learned_at: 7,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 7,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 7,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 7,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 7,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 7,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 7,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'colosseum',
              url: 'https://pokeapi.co/api/v2/version-group/12/'
            }
          },
          {
            level_learned_at: 7,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'xd',
              url: 'https://pokeapi.co/api/v2/version-group/13/'
            }
          },
          {
            level_learned_at: 7,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 7,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 7,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 7,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'growth',
          url: 'https://pokeapi.co/api/v2/move/74/'
        },
        version_group_details: [
          {
            level_learned_at: 34,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'red-blue',
              url: 'https://pokeapi.co/api/v2/version-group/1/'
            }
          },
          {
            level_learned_at: 34,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'yellow',
              url: 'https://pokeapi.co/api/v2/version-group/2/'
            }
          },
          {
            level_learned_at: 32,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'gold-silver',
              url: 'https://pokeapi.co/api/v2/version-group/3/'
            }
          },
          {
            level_learned_at: 32,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'crystal',
              url: 'https://pokeapi.co/api/v2/version-group/4/'
            }
          },
          {
            level_learned_at: 32,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'ruby-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/5/'
            }
          },
          {
            level_learned_at: 32,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 32,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 25,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 25,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 25,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 25,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 32,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'colosseum',
              url: 'https://pokeapi.co/api/v2/version-group/12/'
            }
          },
          {
            level_learned_at: 32,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'xd',
              url: 'https://pokeapi.co/api/v2/version-group/13/'
            }
          },
          {
            level_learned_at: 25,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 25,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 25,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 25,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 25,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'razor-leaf',
          url: 'https://pokeapi.co/api/v2/move/75/'
        },
        version_group_details: [
          {
            level_learned_at: 27,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'red-blue',
              url: 'https://pokeapi.co/api/v2/version-group/1/'
            }
          },
          {
            level_learned_at: 27,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'yellow',
              url: 'https://pokeapi.co/api/v2/version-group/2/'
            }
          },
          {
            level_learned_at: 20,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'gold-silver',
              url: 'https://pokeapi.co/api/v2/version-group/3/'
            }
          },
          {
            level_learned_at: 20,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'crystal',
              url: 'https://pokeapi.co/api/v2/version-group/4/'
            }
          },
          {
            level_learned_at: 20,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'ruby-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/5/'
            }
          },
          {
            level_learned_at: 20,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 20,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 19,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 19,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 19,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 19,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 20,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'colosseum',
              url: 'https://pokeapi.co/api/v2/version-group/12/'
            }
          },
          {
            level_learned_at: 20,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'xd',
              url: 'https://pokeapi.co/api/v2/version-group/13/'
            }
          },
          {
            level_learned_at: 19,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 19,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 19,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 19,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 19,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'solar-beam',
          url: 'https://pokeapi.co/api/v2/move/76/'
        },
        version_group_details: [
          {
            level_learned_at: 48,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'red-blue',
              url: 'https://pokeapi.co/api/v2/version-group/1/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'red-blue',
              url: 'https://pokeapi.co/api/v2/version-group/1/'
            }
          },
          {
            level_learned_at: 48,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'yellow',
              url: 'https://pokeapi.co/api/v2/version-group/2/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'yellow',
              url: 'https://pokeapi.co/api/v2/version-group/2/'
            }
          },
          {
            level_learned_at: 46,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'gold-silver',
              url: 'https://pokeapi.co/api/v2/version-group/3/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'gold-silver',
              url: 'https://pokeapi.co/api/v2/version-group/3/'
            }
          },
          {
            level_learned_at: 46,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'crystal',
              url: 'https://pokeapi.co/api/v2/version-group/4/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'crystal',
              url: 'https://pokeapi.co/api/v2/version-group/4/'
            }
          },
          {
            level_learned_at: 46,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'ruby-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/5/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ruby-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/5/'
            }
          },
          {
            level_learned_at: 46,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 46,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 46,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'colosseum',
              url: 'https://pokeapi.co/api/v2/version-group/12/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'colosseum',
              url: 'https://pokeapi.co/api/v2/version-group/12/'
            }
          },
          {
            level_learned_at: 46,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'xd',
              url: 'https://pokeapi.co/api/v2/version-group/13/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'xd',
              url: 'https://pokeapi.co/api/v2/version-group/13/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'poison-powder',
          url: 'https://pokeapi.co/api/v2/move/77/'
        },
        version_group_details: [
          {
            level_learned_at: 20,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'red-blue',
              url: 'https://pokeapi.co/api/v2/version-group/1/'
            }
          },
          {
            level_learned_at: 20,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'yellow',
              url: 'https://pokeapi.co/api/v2/version-group/2/'
            }
          },
          {
            level_learned_at: 15,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'gold-silver',
              url: 'https://pokeapi.co/api/v2/version-group/3/'
            }
          },
          {
            level_learned_at: 15,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'crystal',
              url: 'https://pokeapi.co/api/v2/version-group/4/'
            }
          },
          {
            level_learned_at: 15,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'ruby-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/5/'
            }
          },
          {
            level_learned_at: 15,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 15,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 13,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 13,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 13,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 13,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 15,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'colosseum',
              url: 'https://pokeapi.co/api/v2/version-group/12/'
            }
          },
          {
            level_learned_at: 15,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'xd',
              url: 'https://pokeapi.co/api/v2/version-group/13/'
            }
          },
          {
            level_learned_at: 13,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 13,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 13,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 13,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 13,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'sleep-powder',
          url: 'https://pokeapi.co/api/v2/move/79/'
        },
        version_group_details: [
          {
            level_learned_at: 41,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'red-blue',
              url: 'https://pokeapi.co/api/v2/version-group/1/'
            }
          },
          {
            level_learned_at: 41,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'yellow',
              url: 'https://pokeapi.co/api/v2/version-group/2/'
            }
          },
          {
            level_learned_at: 15,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'gold-silver',
              url: 'https://pokeapi.co/api/v2/version-group/3/'
            }
          },
          {
            level_learned_at: 15,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'crystal',
              url: 'https://pokeapi.co/api/v2/version-group/4/'
            }
          },
          {
            level_learned_at: 15,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'ruby-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/5/'
            }
          },
          {
            level_learned_at: 15,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 15,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 13,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 13,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 13,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 13,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 15,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'colosseum',
              url: 'https://pokeapi.co/api/v2/version-group/12/'
            }
          },
          {
            level_learned_at: 15,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'xd',
              url: 'https://pokeapi.co/api/v2/version-group/13/'
            }
          },
          {
            level_learned_at: 13,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 13,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 13,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 13,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 13,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'petal-dance',
          url: 'https://pokeapi.co/api/v2/move/80/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'gold-silver',
              url: 'https://pokeapi.co/api/v2/version-group/3/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'crystal',
              url: 'https://pokeapi.co/api/v2/version-group/4/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'ruby-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/5/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'string-shot',
          url: 'https://pokeapi.co/api/v2/move/81/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          }
        ]
      },
      {
        move: {
          name: 'toxic',
          url: 'https://pokeapi.co/api/v2/move/92/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'red-blue',
              url: 'https://pokeapi.co/api/v2/version-group/1/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'yellow',
              url: 'https://pokeapi.co/api/v2/version-group/2/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'gold-silver',
              url: 'https://pokeapi.co/api/v2/version-group/3/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'crystal',
              url: 'https://pokeapi.co/api/v2/version-group/4/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ruby-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/5/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'colosseum',
              url: 'https://pokeapi.co/api/v2/version-group/12/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'xd',
              url: 'https://pokeapi.co/api/v2/version-group/13/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'rage',
          url: 'https://pokeapi.co/api/v2/move/99/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'red-blue',
              url: 'https://pokeapi.co/api/v2/version-group/1/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'yellow',
              url: 'https://pokeapi.co/api/v2/version-group/2/'
            }
          }
        ]
      },
      {
        move: {
          name: 'mimic',
          url: 'https://pokeapi.co/api/v2/move/102/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'red-blue',
              url: 'https://pokeapi.co/api/v2/version-group/1/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'yellow',
              url: 'https://pokeapi.co/api/v2/version-group/2/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'xd',
              url: 'https://pokeapi.co/api/v2/version-group/13/'
            }
          }
        ]
      },
      {
        move: {
          name: 'double-team',
          url: 'https://pokeapi.co/api/v2/move/104/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'red-blue',
              url: 'https://pokeapi.co/api/v2/version-group/1/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'yellow',
              url: 'https://pokeapi.co/api/v2/version-group/2/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'gold-silver',
              url: 'https://pokeapi.co/api/v2/version-group/3/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'crystal',
              url: 'https://pokeapi.co/api/v2/version-group/4/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ruby-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/5/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'colosseum',
              url: 'https://pokeapi.co/api/v2/version-group/12/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'xd',
              url: 'https://pokeapi.co/api/v2/version-group/13/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'defense-curl',
          url: 'https://pokeapi.co/api/v2/move/111/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'gold-silver',
              url: 'https://pokeapi.co/api/v2/version-group/3/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'crystal',
              url: 'https://pokeapi.co/api/v2/version-group/4/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          }
        ]
      },
      {
        move: {
          name: 'light-screen',
          url: 'https://pokeapi.co/api/v2/move/113/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'gold-silver',
              url: 'https://pokeapi.co/api/v2/version-group/3/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'crystal',
              url: 'https://pokeapi.co/api/v2/version-group/4/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'ruby-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/5/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'reflect',
          url: 'https://pokeapi.co/api/v2/move/115/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'red-blue',
              url: 'https://pokeapi.co/api/v2/version-group/1/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'yellow',
              url: 'https://pokeapi.co/api/v2/version-group/2/'
            }
          }
        ]
      },
      {
        move: {
          name: 'bide',
          url: 'https://pokeapi.co/api/v2/move/117/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'red-blue',
              url: 'https://pokeapi.co/api/v2/version-group/1/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'yellow',
              url: 'https://pokeapi.co/api/v2/version-group/2/'
            }
          }
        ]
      },
      {
        move: {
          name: 'sludge',
          url: 'https://pokeapi.co/api/v2/move/124/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'skull-bash',
          url: 'https://pokeapi.co/api/v2/move/130/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'gold-silver',
              url: 'https://pokeapi.co/api/v2/version-group/3/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'crystal',
              url: 'https://pokeapi.co/api/v2/version-group/4/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'ruby-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/5/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'amnesia',
          url: 'https://pokeapi.co/api/v2/move/133/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'flash',
          url: 'https://pokeapi.co/api/v2/move/148/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'gold-silver',
              url: 'https://pokeapi.co/api/v2/version-group/3/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'crystal',
              url: 'https://pokeapi.co/api/v2/version-group/4/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ruby-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/5/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'colosseum',
              url: 'https://pokeapi.co/api/v2/version-group/12/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'xd',
              url: 'https://pokeapi.co/api/v2/version-group/13/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          }
        ]
      },
      {
        move: {
          name: 'rest',
          url: 'https://pokeapi.co/api/v2/move/156/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'red-blue',
              url: 'https://pokeapi.co/api/v2/version-group/1/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'yellow',
              url: 'https://pokeapi.co/api/v2/version-group/2/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'gold-silver',
              url: 'https://pokeapi.co/api/v2/version-group/3/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'crystal',
              url: 'https://pokeapi.co/api/v2/version-group/4/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ruby-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/5/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'colosseum',
              url: 'https://pokeapi.co/api/v2/version-group/12/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'xd',
              url: 'https://pokeapi.co/api/v2/version-group/13/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'substitute',
          url: 'https://pokeapi.co/api/v2/move/164/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'red-blue',
              url: 'https://pokeapi.co/api/v2/version-group/1/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'yellow',
              url: 'https://pokeapi.co/api/v2/version-group/2/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'xd',
              url: 'https://pokeapi.co/api/v2/version-group/13/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'snore',
          url: 'https://pokeapi.co/api/v2/move/173/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'gold-silver',
              url: 'https://pokeapi.co/api/v2/version-group/3/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'crystal',
              url: 'https://pokeapi.co/api/v2/version-group/4/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          }
        ]
      },
      {
        move: {
          name: 'curse',
          url: 'https://pokeapi.co/api/v2/move/174/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'gold-silver',
              url: 'https://pokeapi.co/api/v2/version-group/3/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'crystal',
              url: 'https://pokeapi.co/api/v2/version-group/4/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'ruby-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/5/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'protect',
          url: 'https://pokeapi.co/api/v2/move/182/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'gold-silver',
              url: 'https://pokeapi.co/api/v2/version-group/3/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'crystal',
              url: 'https://pokeapi.co/api/v2/version-group/4/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ruby-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/5/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'colosseum',
              url: 'https://pokeapi.co/api/v2/version-group/12/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'xd',
              url: 'https://pokeapi.co/api/v2/version-group/13/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'sludge-bomb',
          url: 'https://pokeapi.co/api/v2/move/188/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ruby-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/5/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'colosseum',
              url: 'https://pokeapi.co/api/v2/version-group/12/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'xd',
              url: 'https://pokeapi.co/api/v2/version-group/13/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'mud-slap',
          url: 'https://pokeapi.co/api/v2/move/189/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'gold-silver',
              url: 'https://pokeapi.co/api/v2/version-group/3/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'crystal',
              url: 'https://pokeapi.co/api/v2/version-group/4/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          }
        ]
      },
      {
        move: {
          name: 'giga-drain',
          url: 'https://pokeapi.co/api/v2/move/202/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'gold-silver',
              url: 'https://pokeapi.co/api/v2/version-group/3/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'crystal',
              url: 'https://pokeapi.co/api/v2/version-group/4/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ruby-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/5/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'colosseum',
              url: 'https://pokeapi.co/api/v2/version-group/12/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'xd',
              url: 'https://pokeapi.co/api/v2/version-group/13/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'endure',
          url: 'https://pokeapi.co/api/v2/move/203/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'gold-silver',
              url: 'https://pokeapi.co/api/v2/version-group/3/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'crystal',
              url: 'https://pokeapi.co/api/v2/version-group/4/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'charm',
          url: 'https://pokeapi.co/api/v2/move/204/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'gold-silver',
              url: 'https://pokeapi.co/api/v2/version-group/3/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'ruby-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/5/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'swagger',
          url: 'https://pokeapi.co/api/v2/move/207/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'gold-silver',
              url: 'https://pokeapi.co/api/v2/version-group/3/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'crystal',
              url: 'https://pokeapi.co/api/v2/version-group/4/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'xd',
              url: 'https://pokeapi.co/api/v2/version-group/13/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'fury-cutter',
          url: 'https://pokeapi.co/api/v2/move/210/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'gold-silver',
              url: 'https://pokeapi.co/api/v2/version-group/3/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'crystal',
              url: 'https://pokeapi.co/api/v2/version-group/4/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          }
        ]
      },
      {
        move: {
          name: 'attract',
          url: 'https://pokeapi.co/api/v2/move/213/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'gold-silver',
              url: 'https://pokeapi.co/api/v2/version-group/3/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'crystal',
              url: 'https://pokeapi.co/api/v2/version-group/4/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ruby-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/5/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'colosseum',
              url: 'https://pokeapi.co/api/v2/version-group/12/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'xd',
              url: 'https://pokeapi.co/api/v2/version-group/13/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'sleep-talk',
          url: 'https://pokeapi.co/api/v2/move/214/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'gold-silver',
              url: 'https://pokeapi.co/api/v2/version-group/3/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'crystal',
              url: 'https://pokeapi.co/api/v2/version-group/4/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'return',
          url: 'https://pokeapi.co/api/v2/move/216/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'gold-silver',
              url: 'https://pokeapi.co/api/v2/version-group/3/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'crystal',
              url: 'https://pokeapi.co/api/v2/version-group/4/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ruby-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/5/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'colosseum',
              url: 'https://pokeapi.co/api/v2/version-group/12/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'xd',
              url: 'https://pokeapi.co/api/v2/version-group/13/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'frustration',
          url: 'https://pokeapi.co/api/v2/move/218/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'gold-silver',
              url: 'https://pokeapi.co/api/v2/version-group/3/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'crystal',
              url: 'https://pokeapi.co/api/v2/version-group/4/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ruby-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/5/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'colosseum',
              url: 'https://pokeapi.co/api/v2/version-group/12/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'xd',
              url: 'https://pokeapi.co/api/v2/version-group/13/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'safeguard',
          url: 'https://pokeapi.co/api/v2/move/219/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'gold-silver',
              url: 'https://pokeapi.co/api/v2/version-group/3/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'crystal',
              url: 'https://pokeapi.co/api/v2/version-group/4/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'ruby-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/5/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'sweet-scent',
          url: 'https://pokeapi.co/api/v2/move/230/'
        },
        version_group_details: [
          {
            level_learned_at: 25,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'gold-silver',
              url: 'https://pokeapi.co/api/v2/version-group/3/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'gold-silver',
              url: 'https://pokeapi.co/api/v2/version-group/3/'
            }
          },
          {
            level_learned_at: 25,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'crystal',
              url: 'https://pokeapi.co/api/v2/version-group/4/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'crystal',
              url: 'https://pokeapi.co/api/v2/version-group/4/'
            }
          },
          {
            level_learned_at: 25,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'ruby-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/5/'
            }
          },
          {
            level_learned_at: 25,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 25,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 21,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 21,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 21,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 21,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 25,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'colosseum',
              url: 'https://pokeapi.co/api/v2/version-group/12/'
            }
          },
          {
            level_learned_at: 25,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'xd',
              url: 'https://pokeapi.co/api/v2/version-group/13/'
            }
          },
          {
            level_learned_at: 21,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 21,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 21,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 21,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 21,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'synthesis',
          url: 'https://pokeapi.co/api/v2/move/235/'
        },
        version_group_details: [
          {
            level_learned_at: 39,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'gold-silver',
              url: 'https://pokeapi.co/api/v2/version-group/3/'
            }
          },
          {
            level_learned_at: 39,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'crystal',
              url: 'https://pokeapi.co/api/v2/version-group/4/'
            }
          },
          {
            level_learned_at: 39,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'ruby-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/5/'
            }
          },
          {
            level_learned_at: 39,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 39,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 33,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 33,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 33,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 33,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 39,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'colosseum',
              url: 'https://pokeapi.co/api/v2/version-group/12/'
            }
          },
          {
            level_learned_at: 39,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'xd',
              url: 'https://pokeapi.co/api/v2/version-group/13/'
            }
          },
          {
            level_learned_at: 33,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 33,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 33,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 33,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 33,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'hidden-power',
          url: 'https://pokeapi.co/api/v2/move/237/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'gold-silver',
              url: 'https://pokeapi.co/api/v2/version-group/3/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'crystal',
              url: 'https://pokeapi.co/api/v2/version-group/4/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ruby-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/5/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'colosseum',
              url: 'https://pokeapi.co/api/v2/version-group/12/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'xd',
              url: 'https://pokeapi.co/api/v2/version-group/13/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'sunny-day',
          url: 'https://pokeapi.co/api/v2/move/241/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'gold-silver',
              url: 'https://pokeapi.co/api/v2/version-group/3/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'crystal',
              url: 'https://pokeapi.co/api/v2/version-group/4/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ruby-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/5/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'colosseum',
              url: 'https://pokeapi.co/api/v2/version-group/12/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'xd',
              url: 'https://pokeapi.co/api/v2/version-group/13/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'rock-smash',
          url: 'https://pokeapi.co/api/v2/move/249/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ruby-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/5/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'colosseum',
              url: 'https://pokeapi.co/api/v2/version-group/12/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'xd',
              url: 'https://pokeapi.co/api/v2/version-group/13/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          }
        ]
      },
      {
        move: {
          name: 'facade',
          url: 'https://pokeapi.co/api/v2/move/263/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ruby-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/5/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'colosseum',
              url: 'https://pokeapi.co/api/v2/version-group/12/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'xd',
              url: 'https://pokeapi.co/api/v2/version-group/13/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'nature-power',
          url: 'https://pokeapi.co/api/v2/move/267/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'ingrain',
          url: 'https://pokeapi.co/api/v2/move/275/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'knock-off',
          url: 'https://pokeapi.co/api/v2/move/282/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          }
        ]
      },
      {
        move: {
          name: 'secret-power',
          url: 'https://pokeapi.co/api/v2/move/290/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ruby-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/5/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'colosseum',
              url: 'https://pokeapi.co/api/v2/version-group/12/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'xd',
              url: 'https://pokeapi.co/api/v2/version-group/13/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          }
        ]
      },
      {
        move: {
          name: 'grass-whistle',
          url: 'https://pokeapi.co/api/v2/move/320/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'ruby-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/5/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'bullet-seed',
          url: 'https://pokeapi.co/api/v2/move/331/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ruby-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/5/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'colosseum',
              url: 'https://pokeapi.co/api/v2/version-group/12/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'xd',
              url: 'https://pokeapi.co/api/v2/version-group/13/'
            }
          }
        ]
      },
      {
        move: {
          name: 'magical-leaf',
          url: 'https://pokeapi.co/api/v2/move/345/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'ruby-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/5/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'emerald',
              url: 'https://pokeapi.co/api/v2/version-group/6/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'firered-leafgreen',
              url: 'https://pokeapi.co/api/v2/version-group/7/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'natural-gift',
          url: 'https://pokeapi.co/api/v2/move/363/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          }
        ]
      },
      {
        move: {
          name: 'worry-seed',
          url: 'https://pokeapi.co/api/v2/move/388/'
        },
        version_group_details: [
          {
            level_learned_at: 31,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 31,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 31,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 31,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 31,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 31,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 31,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 31,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 31,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'seed-bomb',
          url: 'https://pokeapi.co/api/v2/move/402/'
        },
        version_group_details: [
          {
            level_learned_at: 37,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 37,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 37,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 37,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 37,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 37,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 37,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 37,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 37,
            move_learn_method: {
              name: 'level-up',
              url: 'https://pokeapi.co/api/v2/move-learn-method/1/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'energy-ball',
          url: 'https://pokeapi.co/api/v2/move/412/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'leaf-storm',
          url: 'https://pokeapi.co/api/v2/move/437/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'power-whip',
          url: 'https://pokeapi.co/api/v2/move/438/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'captivate',
          url: 'https://pokeapi.co/api/v2/move/445/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          }
        ]
      },
      {
        move: {
          name: 'grass-knot',
          url: 'https://pokeapi.co/api/v2/move/447/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'diamond-pearl',
              url: 'https://pokeapi.co/api/v2/version-group/8/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'platinum',
              url: 'https://pokeapi.co/api/v2/version-group/9/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'heartgold-soulsilver',
              url: 'https://pokeapi.co/api/v2/version-group/10/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'venoshock',
          url: 'https://pokeapi.co/api/v2/move/474/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'round',
          url: 'https://pokeapi.co/api/v2/move/496/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'echoed-voice',
          url: 'https://pokeapi.co/api/v2/move/497/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'grass-pledge',
          url: 'https://pokeapi.co/api/v2/move/520/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'black-white',
              url: 'https://pokeapi.co/api/v2/version-group/11/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'black-2-white-2',
              url: 'https://pokeapi.co/api/v2/version-group/14/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'tutor',
              url: 'https://pokeapi.co/api/v2/move-learn-method/3/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'work-up',
          url: 'https://pokeapi.co/api/v2/move/526/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'grassy-terrain',
          url: 'https://pokeapi.co/api/v2/move/580/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'egg',
              url: 'https://pokeapi.co/api/v2/move-learn-method/2/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      },
      {
        move: {
          name: 'confide',
          url: 'https://pokeapi.co/api/v2/move/590/'
        },
        version_group_details: [
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'x-y',
              url: 'https://pokeapi.co/api/v2/version-group/15/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'omega-ruby-alpha-sapphire',
              url: 'https://pokeapi.co/api/v2/version-group/16/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'sun-moon',
              url: 'https://pokeapi.co/api/v2/version-group/17/'
            }
          },
          {
            level_learned_at: 0,
            move_learn_method: {
              name: 'machine',
              url: 'https://pokeapi.co/api/v2/move-learn-method/4/'
            },
            version_group: {
              name: 'ultra-sun-ultra-moon',
              url: 'https://pokeapi.co/api/v2/version-group/18/'
            }
          }
        ]
      }
    ],
    name: 'bulbasaur',
    order: 1,
    species: {
      name: 'bulbasaur',
      url: 'https://pokeapi.co/api/v2/pokemon-species/1/'
    },
    sprites: {
      back_default:
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/1.png',
      back_female: null,
      back_shiny:
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/shiny/1.png',
      back_shiny_female: null,
      front_default:
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png',
      front_female: null,
      front_shiny:
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/1.png',
      front_shiny_female: null,
      other: {
        dream_world: {
          front_default:
            'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/1.svg',
          front_female: null
        },
        'official-artwork': {
          front_default:
            'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png'
        }
      },
      versions: {
        'generation-i': {
          'red-blue': {
            back_default:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue/back/1.png',
            back_gray:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue/back/gray/1.png',
            front_default:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue/1.png',
            front_gray:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue/gray/1.png'
          },
          yellow: {
            back_default:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/yellow/back/1.png',
            back_gray:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/yellow/back/gray/1.png',
            front_default:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/yellow/1.png',
            front_gray:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/yellow/gray/1.png'
          }
        },
        'generation-ii': {
          crystal: {
            back_default:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ii/crystal/back/1.png',
            back_shiny:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ii/crystal/back/shiny/1.png',
            front_default:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ii/crystal/1.png',
            front_shiny:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ii/crystal/shiny/1.png'
          },
          gold: {
            back_default:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ii/gold/back/1.png',
            back_shiny:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ii/gold/back/shiny/1.png',
            front_default:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ii/gold/1.png',
            front_shiny:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ii/gold/shiny/1.png'
          },
          silver: {
            back_default:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ii/silver/back/1.png',
            back_shiny:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ii/silver/back/shiny/1.png',
            front_default:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ii/silver/1.png',
            front_shiny:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ii/silver/shiny/1.png'
          }
        },
        'generation-iii': {
          emerald: {
            front_default:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/emerald/1.png',
            front_shiny:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/emerald/shiny/1.png'
          },
          'firered-leafgreen': {
            back_default:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/firered-leafgreen/back/1.png',
            back_shiny:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/firered-leafgreen/back/shiny/1.png',
            front_default:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/firered-leafgreen/1.png',
            front_shiny:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/firered-leafgreen/shiny/1.png'
          },
          'ruby-sapphire': {
            back_default:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/ruby-sapphire/back/1.png',
            back_shiny:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/ruby-sapphire/back/shiny/1.png',
            front_default:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/ruby-sapphire/1.png',
            front_shiny:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/ruby-sapphire/shiny/1.png'
          }
        },
        'generation-iv': {
          'diamond-pearl': {
            back_default:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iv/diamond-pearl/back/1.png',
            back_female: null,
            back_shiny:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iv/diamond-pearl/back/shiny/1.png',
            back_shiny_female: null,
            front_default:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iv/diamond-pearl/1.png',
            front_female: null,
            front_shiny:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iv/diamond-pearl/shiny/1.png',
            front_shiny_female: null
          },
          'heartgold-soulsilver': {
            back_default:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iv/heartgold-soulsilver/back/1.png',
            back_female: null,
            back_shiny:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iv/heartgold-soulsilver/back/shiny/1.png',
            back_shiny_female: null,
            front_default:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iv/heartgold-soulsilver/1.png',
            front_female: null,
            front_shiny:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iv/heartgold-soulsilver/shiny/1.png',
            front_shiny_female: null
          },
          platinum: {
            back_default:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iv/platinum/back/1.png',
            back_female: null,
            back_shiny:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iv/platinum/back/shiny/1.png',
            back_shiny_female: null,
            front_default:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iv/platinum/1.png',
            front_female: null,
            front_shiny:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iv/platinum/shiny/1.png',
            front_shiny_female: null
          }
        },
        'generation-v': {
          'black-white': {
            animated: {
              back_default:
                'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/back/1.gif',
              back_female: null,
              back_shiny:
                'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/back/shiny/1.gif',
              back_shiny_female: null,
              front_default:
                'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/1.gif',
              front_female: null,
              front_shiny:
                'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/shiny/1.gif',
              front_shiny_female: null
            },
            back_default:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/back/1.png',
            back_female: null,
            back_shiny:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/back/shiny/1.png',
            back_shiny_female: null,
            front_default:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/1.png',
            front_female: null,
            front_shiny:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/shiny/1.png',
            front_shiny_female: null
          }
        },
        'generation-vi': {
          'omegaruby-alphasapphire': {
            front_default:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-vi/omegaruby-alphasapphire/1.png',
            front_female: null,
            front_shiny:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-vi/omegaruby-alphasapphire/shiny/1.png',
            front_shiny_female: null
          },
          'x-y': {
            front_default:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-vi/x-y/1.png',
            front_female: null,
            front_shiny:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-vi/x-y/shiny/1.png',
            front_shiny_female: null
          }
        },
        'generation-vii': {
          icons: {
            front_default:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-vii/icons/1.png',
            front_female: null
          },
          'ultra-sun-ultra-moon': {
            front_default:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-vii/ultra-sun-ultra-moon/1.png',
            front_female: null,
            front_shiny:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-vii/ultra-sun-ultra-moon/shiny/1.png',
            front_shiny_female: null
          }
        },
        'generation-viii': {
          icons: {
            front_default:
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-viii/icons/1.png',
            front_female: null
          }
        }
      }
    },
    stats: [
      {
        base_stat: 45,
        effort: 0,
        stat: {
          name: 'hp',
          url: 'https://pokeapi.co/api/v2/stat/1/'
        }
      },
      {
        base_stat: 49,
        effort: 0,
        stat: {
          name: 'attack',
          url: 'https://pokeapi.co/api/v2/stat/2/'
        }
      },
      {
        base_stat: 49,
        effort: 0,
        stat: {
          name: 'defense',
          url: 'https://pokeapi.co/api/v2/stat/3/'
        }
      },
      {
        base_stat: 65,
        effort: 1,
        stat: {
          name: 'special-attack',
          url: 'https://pokeapi.co/api/v2/stat/4/'
        }
      },
      {
        base_stat: 65,
        effort: 0,
        stat: {
          name: 'special-defense',
          url: 'https://pokeapi.co/api/v2/stat/5/'
        }
      },
      {
        base_stat: 45,
        effort: 0,
        stat: {
          name: 'speed',
          url: 'https://pokeapi.co/api/v2/stat/6/'
        }
      }
    ],
    types: [
      {
        slot: 1,
        type: {
          name: 'grass',
          url: 'https://pokeapi.co/api/v2/type/12/'
        }
      },
      {
        slot: 2,
        type: {
          name: 'poison',
          url: 'https://pokeapi.co/api/v2/type/4/'
        }
      }
    ],
    weight: 69
  }
};
