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

const getPokemon = async ({ query }) => {
  try {
    const response = await axios.get(
      `https://pokeapi.co/api/v2/pokemon/${query}`
    );
    // TODO - do the data transformation here
    return response.data;
  } catch (error) {
    // TODO - decide how to handle errors
    console.error(error.response.status);
  }
};

export { getPokemonList, getPokemon };
