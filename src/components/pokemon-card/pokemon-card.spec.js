import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import PokemonCard from 'components/pokemon-card/pokemon-card';

describe('Pokemon Card', () => {
  it('renders correctly', () => {
    // Arrange
    render(<PokemonCard pokemonData={POKEMON_DATA} />);

    // Act & Assert
    expect(screen.getByText('#151')).toBeInTheDocument();
    expect(screen.getByText('Mew')).toBeInTheDocument();
    expect(screen.getByText('Height: 4')).toBeInTheDocument();
    expect(screen.getByText('Weight: 40')).toBeInTheDocument();
    expect(screen.getByText('Types: psychic')).toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('renders a message if pokemonData contains an error', () => {
    // Arrange
    render(<PokemonCard pokemonData={new Error()} />);

    // Act & Assert
    expect(
      screen.getByText(
        "Sorry, but we can't find that Pokemon. Please try again."
      )
    ).toBeInTheDocument();
  });
});

const POKEMON_DATA = {
  id: 151,
  name: 'mew',
  height: 4,
  weight: 40,
  image:
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/151.png',
  types: ['psychic']
};
