import axios from 'axios';

const getPokemonList = async ({ offset = 0, limit = 20 }) => {
  try {
    const response = await axios.get(
      `https://pokeapi.co/api/v2/pokemon/?offset=${offset}&limit=${limit}`
    );
    // TODO - do the data transformation here
    return response.data;
  } catch (error) {
    // TODO - decide how to handle errors
    console.error(error.response.status);
  }
};

const getPokemon = async ({ query = '1' }) => {
  try {
    const response = await axios.get(
      `https://pokeapi.co/api/v2/pokemon/${query}`
    );

    return transformPokemonResponse({ response });
  } catch (error) {
    // TODO - decide how to handle errors
    console.error(error);
  }
};

const transformPokemonResponse = ({ response }) => {
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
};

export { getPokemonList, getPokemon, transformPokemonResponse };
