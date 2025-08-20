import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import logoFinanzapp from '/public/img/finanzapp.png'


function Header() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  return (
    <header className="header">
      <div className="container">
        <div className="logo">
          <img className="logo-finanzapp" src={logoFinanzapp} />
        </div>

        <button className="hamburger-menu" onClick={toggleMenu}>
          <span className="hamburger-bar"></span>
          <span className="hamburger-bar"></span>
          <span className="hamburger-bar"></span>
        </button>
        <nav className={`nav-links ${isOpen ? 'open' : ''}`}>
          <ul className="nav-list">
            <li className="nav-item"><Link to="/" className='nav-link'>Home</Link></li>
            <li className="nav-item"><Link to="/registerexpense" className='nav-link'>Registrar gastos</Link></li>
            <li className="nav-item"><Link to="/viewexpenses" className="nav-link">Historial</Link></li>
          </ul>

          {/*   <Link to="/dashboard">Dashboard</Link>
        <Link to="/add-expense">Registrar Gasto</Link>
        <Link to="/expenses">Ver Gastos</Link>
        <Link to="/compare-prices">Comparar Precios</Link> */}
        </nav>
      </div>
    </header>
  )
}

export default Header