import SearchWidget from 'components/search-widget/search-widget';
import './app.css';

const App = () => {
  return (
    <div className="App">
      <header className="App-header">
        <p>Pokedex built in React</p>
        <SearchWidget />
      </header>
    </div>
  );
};

export default App;
