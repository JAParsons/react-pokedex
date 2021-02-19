import axios from 'axios';
import {
  RequestError,
  ResponseError,
  ParsingError,
  UnknownError
} from './errors';

const getPokemonList = async ({ offset = 0, limit = 20 }) => {
  try {
    const response = await axios.get(
      `https://pokeapi.co/api/v2/pokemon/?offset=${offset}&limit=${limit}`
    );
    // TODO - do the data transformation here
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

const getPokemon = async ({ query = '1' }) => {
  let response;
  try {
    response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${query}`);
  } catch (error) {
    return handleError(error);
  }
  return transformPokemonResponse({ response });
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
