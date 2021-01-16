import React, { useState } from 'react';
import { getPokemon } from 'packages/pokeapi';

const SearchWidget = () => {
  const [searchStr, setSearchStr] = useState('');
  const [pokemon, setPokemon] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = await getPokemon(searchStr);
    setPokemon(data);
  };

  return (
    <>
      <p>Search Pokedex</p>
      <form onSubmit={(event) => handleSubmit(event)}>
        <input
          type="text"
          placeholder="Enter name or id"
          value={searchStr}
          onChange={(event) => setSearchStr(event.target.value)}
        />
        <button type="submit">Search</button>
      </form>
      {pokemon ? <p>{JSON.stringify(pokemon)}</p> : null}
    </>
  );
};

export default SearchWidget;
