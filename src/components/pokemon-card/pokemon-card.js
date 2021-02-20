import React from 'react';

const PokemonCard = ({ pokemonData }) => {
  const { id, name, height, weight, types, image } = pokemonData;
  const formattedName = name[0].toUpperCase() + name.substring(1);

  if (pokemonData instanceof Error) {
    return <p>Sorry, but we can't find that Pokemon. Please try again.</p>;
  }

  return (
    <>
      <div>
        <p>{`#${id}`}</p>
        <p>{formattedName}</p>
        <p>{`Height: ${height}`}</p>
        <p>{`Weight: ${weight}`}</p>
        <p>{`Types:${types.map((type) => ` ${type}`)}`}</p>
        <img src={image} alt={`official ${name} artwork`} />
      </div>
    </>
  );
};

export default PokemonCard;
