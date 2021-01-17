import React from 'react';

const PokemonCard = ({ data: { name } }) => {
  return (
    <>
      <div>
        <p>This Pokemon is called {name}</p>
      </div>
    </>
  );
};

export default PokemonCard;
