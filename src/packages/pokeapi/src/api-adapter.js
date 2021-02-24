import axios from 'axios';
import {
  RequestError,
  ResponseError,
  ParsingError,
  UnknownError
} from './errors';

const baseUrl = 'https://pokeapi.co/api/v2/pokemon/';

const getPokemonList = async ({ offset = 0, limit = 20, cache }) => {
  try {
    const response = await apiGet({
      uri: `?offset=${offset}&limit=${limit}`,
      cache
    });
    return response.data;
  } catch (error) {
    return handleError(error);
  }
  // TODO - do the data transformation here
  // TODO - add to cache
};

const getPokemon = async ({ query = '1', cache = {} }) => {
  let response;
  try {
    response = await apiGet({ uri: query, cache });
  } catch (error) {
    return handleError(error);
  }
  // Add JSON response to the cache
  setCacheItem({ key: query, value: response, cache });
  return transformPokemonResponse({ response });
};

const apiGet = async ({ uri, cache = {} }) => {
  // Check if the requested resource is in the cache
  const cached = getCacheItem({ key: uri, cache });
  if (!cached) {
    return await axios.get(`${baseUrl}${uri}`);
  }

  return cached;
};

const getCacheItem = ({ key, cache }) => {
  // Check if the requested resource is in the cache
  // const cached = cache.getItem(key) || null;
  const cached = cache[key] || null;

  if (cached) {
    // localStorage stores values as strings, so we need to parse the
    // cached response into a JSON object
    return JSON.parse(cached);
  }

  return cached;
};

const setCacheItem = ({ key, value, cache }) => {
  cache[key] = JSON.stringify(value);
};

const transformPokemonResponse = ({ response }) => {
  try {
    const {
      data: {
        id,
        name,
        height,
        weight,
        types,
        sprites: {
          other: {
            'official-artwork': { front_default: image }
          }
        }
      }
    } = response;
    const typeNames = types.map(({ type: { name } }) => name);

    return { id, name, height, weight, types: typeNames, image };
  } catch (error) {
    return new ParsingError();
  }
};

const handleError = (error) => {
  if (error.response) {
    // client received an error response (5xx, 4xx)
    return new ResponseError(error.response.status);
  } else if (error.request) {
    // client never received a response, or request never left
    return new RequestError();
  } else {
    return new UnknownError();
  }
};

export { getPokemonList, getPokemon, transformPokemonResponse };
