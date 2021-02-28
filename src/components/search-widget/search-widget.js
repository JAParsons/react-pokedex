import React, { useState } from 'react';
import usePokeApi from '../hooks/use-poke-api';
import PokemonCard from 'components/pokemon-card/pokemon-card';

const SearchWidget = () => {
  const [searchStr, setSearchStr] = useState('');
  const [pokemon, setPokemon] = useState('');
  const { getPokemon, cache } = usePokeApi();

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
