import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import PokemonCard from 'components/pokemon-card/pokemon-card';

describe('Pokemon Card', () => {
  it('renders correctly', () => {
    // Arrange
    render(<PokemonCard data={POKEMON_DATA} />);

    // Act & Assert
    expect(screen.getByText('Mew')).toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument();
  });
});

const POKEMON_DATA = {
  abilities: [
    {
      ability: {
        name: 'synchronize',
        url: 'https://pokeapi.co/api/v2/ability/28/'
      },
      is_hidden: false,
      slot: 1
    }
  ],
  base_experience: 270,
  forms: [
    {
      name: 'mew',
      url: 'https://pokeapi.co/api/v2/pokemon-form/151/'
    }
  ],
  game_indices: [],
  height: 4,
  held_items: [],
  id: 151,
  is_default: true,
  location_area_encounters: 'https://pokeapi.co/api/v2/pokemon/151/encounters',
  moves: [],
  name: 'mew',
  order: 233,
  species: {
    name: 'mew',
    url: 'https://pokeapi.co/api/v2/pokemon-species/151/'
  },
  sprites: {
    back_default:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/151.png',
    back_female: null,
    back_shiny:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/shiny/151.png',
    back_shiny_female: null,
    front_default:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/151.png',
    front_female: null,
    front_shiny:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/151.png',
    front_shiny_female: null,
    other: {
      dream_world: {
        front_default:
          'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/151.svg',
        front_female: null
      },
      'official-artwork': {
        front_default:
          'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/151.png'
      }
    },
    versions: {}
  },
  stats: [
    {
      base_stat: 100,
      effort: 3,
      stat: {
        name: 'hp',
        url: 'https://pokeapi.co/api/v2/stat/1/'
      }
    },
    {
      base_stat: 100,
      effort: 0,
      stat: {
        name: 'attack',
        url: 'https://pokeapi.co/api/v2/stat/2/'
      }
    },
    {
      base_stat: 100,
      effort: 0,
      stat: {
        name: 'defense',
        url: 'https://pokeapi.co/api/v2/stat/3/'
      }
    },
    {
      base_stat: 100,
      effort: 0,
      stat: {
        name: 'special-attack',
        url: 'https://pokeapi.co/api/v2/stat/4/'
      }
    },
    {
      base_stat: 100,
      effort: 0,
      stat: {
        name: 'special-defense',
        url: 'https://pokeapi.co/api/v2/stat/5/'
      }
    },
    {
      base_stat: 100,
      effort: 0,
      stat: {
        name: 'speed',
        url: 'https://pokeapi.co/api/v2/stat/6/'
      }
    }
  ],
  types: [
    {
      slot: 1,
      type: {
        name: 'psychic',
        url: 'https://pokeapi.co/api/v2/type/14/'
      }
    }
  ],
  weight: 40
};
