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
    axios.get.mockImplementation(() =>
      Promise.resolve({
        data: {
          name: 'MadeUpPokemon',
          sprites: {
            other: { 'official-artwork': { front_default: 'someImageUrl' } }
          }
        }
      })
    );

    // Act
    userEvent.type(screen.getByPlaceholderText('Enter name or id'), 'mew');
    userEvent.click(screen.getByRole('button'));

    // Assert
    expect(await screen.findByText('MadeUpPokemon')).toBeInTheDocument();
    expect(await screen.findByRole('img')).toBeInTheDocument();
  });
});
