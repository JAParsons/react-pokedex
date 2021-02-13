import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './app';
import axios from 'axios';
jest.mock('axios');

describe('App', () => {
  beforeEach(() => {
    // Arrange
    render(<App />);
  });

  it('renders correctly', () => {
    //Act & Assert
    expect(screen.getByText('Pokedex built in React')).toBeInTheDocument();
  });

  it('can search for a Pokemon', async () => {
    // Arrange
    axios.get.mockImplementation(() => Promise.resolve(POKEMON));

    // Act
    userEvent.type(
      screen.getByPlaceholderText('Enter name or id'),
      'MadeUpPokemon'
    );
    userEvent.click(screen.getByRole('button'));

    // Assert
    expect(await screen.findByText('MadeUpPokemon')).toBeInTheDocument();
    expect(await screen.findByRole('img')).toBeInTheDocument();
  });
});

const POKEMON = {
  data: {
    abilities: [],
    base_experience: 64,
    forms: [],
    game_indices: [],
    height: 7,
    held_items: [],
    id: 1,
    is_default: true,
    location_area_encounters: 'https://pokeapi.co/api/v2/pokemon/1/encounters',
    moves: [],
    name: 'MadeUpPokemon',
    order: 1,
    species: {},
    sprites: {
      other: {
        'official-artwork': {
          front_default:
            'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png'
        }
      },
      versions: {}
    },
    stats: [],
    types: [
      {
        slot: 1,
        type: {
          name: 'grass',
          url: 'https://pokeapi.co/api/v2/type/12/'
        }
      },
      {
        slot: 2,
        type: {
          name: 'poison',
          url: 'https://pokeapi.co/api/v2/type/4/'
        }
      }
    ],
    weight: 69
  }
};
