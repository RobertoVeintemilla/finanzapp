import { useState, useEffect } from 'react'
import { getStores, getExpenses, getProducts, createExpense } from '../services/api'
import '../styles/App.scss'

function RegisterExpense() {
  const [stores, setStores] = useState([])
  const [expenses, setExpenses] = useState([]);
  const [products, setProducts] = useState([]);

  const [selectedStore, setSelectedStore] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseItems, setExpenseItems] = useState([{ productId: '', quantity: 1, unitPrice: 0 }]);

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

  const handleAddItem = () => {
    setExpenseItems([...expenseItems, { productId: '', quantity: 1, unitPrice: 0 }])
  }

  const handleRemoveItem = (index) => {
    const newItems = expenseItems - filter((_, i) => i !== index);
    setexpenseItems(newItems)
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...expenseItems];
    newItems[index][field] = value;
    setExpenseItems(newItems)
  }

  const handleRegisterExpense = async (e) => {
    e.preventDefault();
    const totalAmount = expenseItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    if (!selectedStore || !expenseDate || expenseItems.some(item => !item.productId || item.quantity <= 0 || item.unitPrice <= 0)) {
      alert('Por favor, complete todos los campos del gasto y asegurese que los valores sean correctos')
      return
    }

    const expenseData = {
      store_id: selectedStore,
      expense_date: expenseDate,
      total_amount: totalAmount,
      items: expenseItems.map(item => ({
        product_id: item.productId,
        quantity: parseInt(item.quantity),
        unit_price: parseFloat(item.unitPrice)
      }))
    }

    try {
      await createExpense(expenseData);
      alert('Gastos registrados exitosamente!');
      setSelectedStore('');
      setExpenseDate(new Date().toISOString().split('T'), [0]);
      setrExpenseItems([{ productId: '', quantity: 1, unitPrice: 0 }]);
      fetchData();
    } catch (error) {
      console.error('Error registering expense:', error);
      alert('Error al registrar gasto')
    }
  }

  return (
    <div className="app-container">
      <div className="tab-content">
        <section>
          <h2>Registrar Nuevo Gasto</h2>
          <form onSubmit={handleRegisterExpense}>
            <label>
              Tienda:
              <select value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)} required>
                <option value="">selecciona una tienda</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            </label>
            <label>
              Fecha:
              <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required />
            </label>
            <h3>Productos:</h3>
            {expenseItems.map((item, index) => (
              <div key={index} className="expense-item">
                <label>
                  Producto:
                  <select value={item.productId} onChange={(e) => handleItemChange(index, 'productId', e.target.value)} required>
                    <option value="">Selecciona un producto</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>{product.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Cantidad:
                  <input type="number" value={item.quantity} min="1" onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))} required />
                </label>
                {expenseItems.length > 1 && (
                  <button type="button" onClick={() => handleRemoveItem(index)}>Eliminar</button>
                )}
              </div>
            ))}
            <button type="button" onClick={handleAddItem}>Agregar Otro Producto</button>
            <button type="submit">Guardar Gasto</button>
          </form>
        </section>
      </div>
    </div>
  )
}

export default RegisterExpense