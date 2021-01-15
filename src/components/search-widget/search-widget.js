import React from 'react';

const SearchWidget = () => {
  return (
    <>
      <p>Search Pokedex</p>
      <form>
        <input type="text" placeholder="Enter name or id" />
        <button>Search</button>
      </form>
    </>
  );
};

export default SearchWidget;
