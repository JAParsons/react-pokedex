import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import SearchWidget from 'components/search-widget/search-widget';

describe('search widget', () => {
  it('renders correctly', () => {
    // Arrange & Act
    render(<SearchWidget />);
    const input = screen.queryByPlaceholderText('Enter name or id');

    // Assert
    expect(input).toBeInTheDocument();
  });
});
