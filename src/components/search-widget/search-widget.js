import React, { useState, useContext } from 'react';
import { CacheContext } from '../context/cache-context';
import { getPokemon } from 'packages/pokeapi';
import PokemonCard from 'components/pokemon-card/pokemon-card';

const SearchWidget = () => {
  const [searchStr, setSearchStr] = useState('');
  const [pokemon, setPokemon] = useState('');
  const cache = useContext(CacheContext);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const fetchedPokemon = await getPokemon({ query: searchStr, cache });
    setPokemon(fetchedPokemon);
    setSearchStr('');
  };

  return (
    <>
      <p>Search for a Pokemon</p>
      <form onSubmit={(event) => handleSubmit(event)}>
        <input
          type="text"
          placeholder="Enter name or id"
          value={searchStr}
          onChange={(event) => setSearchStr(event.target.value)}
        />
        <button type="submit">Search</button>
      </form>
      {pokemon ? <PokemonCard pokemonData={pokemon} /> : null}
    </>
  );
};

export default SearchWidget;
