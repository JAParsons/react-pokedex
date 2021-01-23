import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import PokemonCard from 'components/pokemon-card/pokemon-card';

describe('search widget', () => {
  it('renders correctly', () => {
    // Arrange
    render(<PokemonCard data={DATA} />);

    // Act & Assert
    expect(screen.getByText('This Pokemon is called mew')).toBeInTheDocument();
  });
});

const DATA = {
  abilities: [],
  base_experience: 270,
  forms: [{}],
  game_indices: [{}],
  height: 4,
  held_items: [{}],
  id: 151,
  is_default: true,
  location_area_encounters: 'https://pokeapi.co/api/v2/pokemon/151/encounters',
  moves: [{}],
  name: 'mew',
  order: 233,
  species: { name: 'mew', url: 'https://pokeapi.co/api/v2/pokem…' },
  sprites: { back_default: 'https://raw.githubusercontent.com/P…' },
  stats: [{}],
  types: [{}],
  weight: 40
};
