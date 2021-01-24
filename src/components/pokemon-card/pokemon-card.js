import React from 'react';

const PokemonCard = ({
  data: {
    name,
    sprites: {
      other: {
        'official-artwork': { front_default: image }
      }
    }
  }
}) => {
  const formattedName = name[0].toUpperCase() + name.substring(1);

  return (
    <>
      <div>
        <p>{formattedName}</p>
        <img src={image} alt={`official ${name} artwork`} />
      </div>
    </>
  );
};

export default PokemonCard;
