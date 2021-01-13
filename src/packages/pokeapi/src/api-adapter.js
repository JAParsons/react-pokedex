import axios from 'axios';

const getPokemonList = async (offset = 0, limit = 20) => {
  try {
    const response = await axios.get(
      `https://pokeapi.co/api/v2/pokemon/?offset=${offset}&limit=${limit}`
    );
    return await response.data;
  } catch (error) {
    console.error(error);
  }
};

export { getPokemonList };
