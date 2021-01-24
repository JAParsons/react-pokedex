import React, { useState } from 'react';
import { getPokemon } from 'packages/pokeapi';
import Pokemon from 'components/pokemon-card/pokemon-card';

const SearchWidget = () => {
  const [searchStr, setSearchStr] = useState('');
  const [pokemon, setPokemon] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = await getPokemon(searchStr);
    setPokemon(data);
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
      {/* May need to deep copy this later on */}
      {pokemon ? <Pokemon data={pokemon} /> : null}
    </>
  );
};

export default SearchWidget;
