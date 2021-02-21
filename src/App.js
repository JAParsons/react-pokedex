import { CacheProvider } from './components/context/cache-context';
import SearchWidget from 'components/search-widget/search-widget';
import './app.css';

const App = () => {
  return (
    <div className="App">
      <header className="App-header">
        <p>Pokedex built in React</p>
        <CacheProvider>
          <SearchWidget />
        </CacheProvider>
      </header>
    </div>
  );
};

export default App;
