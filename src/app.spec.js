import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './app';

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
    // Act
    userEvent.type(screen.getByPlaceholderText('Enter name or id'), 'pikachu');
    userEvent.click(screen.getByRole('button'));

    // Assert
    expect(
      await screen.findByText('This Pokemon is called pikachu')
    ).toBeInTheDocument();
  });
});
