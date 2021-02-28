import { getPokemon, getPokemonList } from '../../packages/pokeapi/index';

const usePokeApi = () => {
  const cache = localStorage;
  return { getPokemon, getPokemonList, cache };
};

export default usePokeApi;
