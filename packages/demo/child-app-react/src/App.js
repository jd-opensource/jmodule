import './App.css';
import { BrowserRouter, Route, Routes, Link } from 'react-router-dom'
import ChildPageDefault from './components/default';
import Page1 from './components/page1';

const basename = window.__JMODULE_HOST__ ? '/childAppReact' : '';

function App() {
  return (
    <div className="child-app-react__root">
      <h2>Child APP React</h2>
      <BrowserRouter basename={basename}>
        <Link className="child-app-react__link" to="/">Home</Link>
        <Link className="child-app-react__link" to="/page1">Page1</Link>
        <Routes>
          <Route path="/">
            <Route path="" element={<ChildPageDefault />} />
            <Route path="page1" element={<Page1 />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
