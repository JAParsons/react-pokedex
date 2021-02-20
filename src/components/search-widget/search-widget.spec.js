import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SearchWidget from 'components/search-widget/search-widget';
import axios from 'axios';
jest.mock('axios');

describe('search widget', () => {
  beforeEach(() => {
    // Arrange
    render(<SearchWidget />);
  });

  it('renders correctly', () => {
    // Act & Assert
    expect(screen.getByPlaceholderText('Enter name or id')).toBeInTheDocument();
  });

  it('renders a PokemonCard after a successful search', async () => {
    // Arrange
    // Food for thought: Is this mock too low level for this test?
    // Is it better to mock out the api-adapter seeing as that's what
    // the component actually depends on?
    axios.get.mockImplementation(() => Promise.resolve(POKEMON));

    // Act
    await act(async () => {
      userEvent.type(
        screen.getByPlaceholderText('Enter name or id'),
        'bulbasaur'
      );
      userEvent.click(screen.getByRole('button'));
    });

    // Assert
    expect(await screen.findByText('Bulbasaur')).toBeInTheDocument();
    expect(await screen.findByText('#1')).toBeInTheDocument();
    expect(await screen.findByText('Height: 7')).toBeInTheDocument();
    expect(await screen.findByText('Weight: 69')).toBeInTheDocument();
    expect(await screen.findByText('Types: grass, poison')).toBeInTheDocument();
    expect(await screen.findByRole('img')).toBeInTheDocument();
  });

  it('does not render a PokemonCard if a search fails', async () => {
    // Arrange
    // Food for thought: Is this mock too low level for this test?
    // Is it better to mock out the api-adapter seeing as that's what
    // the component actually depends on?
    axios.get.mockImplementation(() =>
      Promise.reject({ response: { status: 404 } })
    );

    // Act
    await act(async () => {
      userEvent.type(
        screen.getByPlaceholderText('Enter name or id'),
        'bulbasaur'
      );
      userEvent.click(screen.getByRole('button'));
    });

    // Assert
    expect(screen.queryByText('Bulbasaur')).not.toBeInTheDocument();
    expect(screen.queryByText('#1')).not.toBeInTheDocument();
    expect(screen.queryByText('Height: 7')).not.toBeInTheDocument();
    expect(screen.queryByText('Weight: 69')).not.toBeInTheDocument();
    expect(screen.queryByText('Types: grass, poison')).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
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
    name: 'bulbasaur',
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
