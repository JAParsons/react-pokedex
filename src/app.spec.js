import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
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
});
