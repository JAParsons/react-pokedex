import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import SearchWidget from 'components/search-widget/search-widget';

describe('search widget', () => {
  it('renders correctly', () => {
    // Arrange
    render(<SearchWidget />);

    // Act & Assert
    expect(screen.getByPlaceholderText('Enter name or id')).toBeInTheDocument();
  });
});
