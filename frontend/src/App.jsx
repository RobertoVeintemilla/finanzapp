
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles/App.scss';

import Header from './components/Header';
import Home from './pages/Home';
import RegisterExpense from './pages/RegisterExpense';
import ViewExpenses from './pages/ViewExpenses'

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/registerexpense" element={<RegisterExpense />} />
        <Route path="/viewexpenses" element={<ViewExpenses />} />
      </Routes>
    </Router>
  )
}

export default App