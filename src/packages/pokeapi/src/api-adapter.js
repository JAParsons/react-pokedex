import axios from 'axios';

const getPokemonList = async (offset = 0, limit = 20) => {
  try {
    const response = await axios.get(
      `https://pokeapi.co/api/v2/pokemon/?offset=${offset}&limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error(error);
  }
};

const getPokemon = async (query) => {
  try {
    const response = await axios.get(
      `https://pokeapi.co/api/v2/pokemon/${query}`
    );
    return response.data;
  } catch (error) {
    console.error(error);
  }
};

export { getPokemonList, getPokemon };
