import { useState, useEffect } from 'react'
import { getStores, getExpenses, getProducts } from '../services/api'

function viewExpenses() {
  const [stores, setStores] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [proucts, setProducts] = useState([]);

  const [selectedStore, setSelectedStore] = useState('');

  useEffect(() => {
    fetchData()
  }, [])
  
  const fetchData = async () => {
    try {
      const [storesRes, productsRes, expensesRes] = await Promise.all([
        getStores(),
        getProducts(),
        getExpenses()
      ]);
      setStores(storesRes.data);
      setProducts(productsRes.data);
      setExpenses(expensesRes.data);
    } catch (error) {
      console.error('Error fetching initial data:', error)
    }
  }

  return (
    <div className="app-container">
      <div className="tab-content">
        <section>
          <h2>Historial de gastos</h2>
          {expenses.length === 0 ? (
            <p>No hay gastos registrados aún.</p>
          ) : (
            <ul className="expense-list">
            {expenses.map(expense => (
              <li key={expense.expense_id}>
                <h3>Tienda: {expense.store_name} ({expense.store_address})</h3>
                <p>Fecha: {new Date(expense.expense_date).toLocaleDateString()}</p>
                <p>Monto Total: ${expense.total_amount}</p>
                <h4>Productos: </h4>
                <ul>
                  {expense.items.map(item => (
                    <li key={item.item_id}>
                      {item.product_name} - Cantidad: {item.quantity} - Precio Unitario: ${item.unit_price}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )

}

export default viewExpenses