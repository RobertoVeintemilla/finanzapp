import { useState, useEffect } from 'react'
import './styles/App.scss'
import {
  getStores, createStore,
  getProducts, createProduct,
  getExpenses, createExpense,
  compareProductPrices
} from './services/api';

function App() {
  const [activeTab, setActiveTab] = useState('registerExpense');
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [comparisonProductId, setComparisonProductId] = useState('');
  const [comparisonResults, setComparisonResults] = useState([]);

  console.log(expenses);

  // Form states for adding new data  
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreAddress, setNewStoreAddress] = useState('');
  const [newProductName, setNewProdcutName] = useState('');
  const [newProductDescription, setNewProductDescription] = useState('');

  // Form states for new expense
  const [selectedStore, setSelectedStore] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseItems, setExpenseItems] = useState([{ productId: '', quantity: 1, unitPrice: 0}]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [storesRes, productsRes, expensesRes] = await Promise.all([
        getStores(),
        getProducts(),
        getExpenses()
      ]);
      setStores(storesRes.data);
      setProducts(productsRes.data);
      setExpenses(expensesRes.data)
    } catch (error) {
      console.error('Error fetching initial data:', error)
    }
  };

  const handleAddStore = async (e) => {
    e.preventDefault();
    try {
      await createStore({ name: newStoreName, address: newStoreAddress })
      alert('Tienda agregada exitosamente!');
      setNewStoreName('');
      setNewStoreAddress('');
      fetchData(); //refresh data
    } catch (error) {
      console.error(' Error adding store:', error);
      alert('Error al agregar tienda');
    }
  }

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await createProduct({ name: newProductName, description: setNewProductDescription});
      alert('Producto agregado exitosamente');
      setNewProductName('');
      setNewProductDescription('');
      fetchData();
    } catch (error) {
      console.error('Error adding product', error);
      alert('Error al agregar producto. Puede que ya exista')
    }
  };

  const handleAddItem = () => {
    setExpenseItems([...expenseItems, {productId: '', quantity: 1, unitPrice: 0}])
  };

  const handleRemoveItem = (index) => {
    const newItems = expenseItems.filter((_, i) => i !== index);
    setExpenseItems(newItems)
  };
  
  const handleItemChange = (index, field, value) => {
    const newItems = [...expenseItems];
    newItems[index][field] = value;
    setExpenseItems(newItems)
  };

  const handleRegisterExpense = async (e) => {
    e.preventDefault();
    const totalAmount = expenseItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    if (!selectedStore  || !expenseDate || expenseItems.some(item => !item.productId || item.quantity <= 0 || item.unitPrice <= 0)) {
      alert('Por favor, complete todos los campos del gasto y asegurese que los valores sean válidos.');
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
    };

    try {
      await createExpense(expenseData);
      alert('Gasto registrado exitosamente!');
      setSelectedStore('');
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setExpenseItems([{ productId: '', quantity: 1, unitPrice: 0}]);
      fetchData();
    } catch (error) {
      console.error('Error registering expense:', error);
      alert('Error al registrar gasto.')
    }
  };

  const handleComparePrices = async () => {
    if (!comparisonProductId) {
      alert('Selecciona un producto para comparar.');
      return;
    }
    try {
      const res = await compareProductPrices(comparisonProductId);
      setComparisonResults(res.data);
    } catch (error) {
      console.error('Error comparing prices', error);
      alert('Error al comparar precios.');
      setComparisonResults([])
    }
  }

  return (
    <div className="app-container">
      <h1>Mi Gestor de gastos</h1>

      <nav className="tabs">
        <button onClick={() => setActiveTab('registerExpense')} className={activeTab === 'registerExpense' ? 'active' : ''}>Registrar Gasto</button>
        <button onClick={() => setActiveTab('viewExpenses')} className={activeTab === 'viewExpenses' ? 'active' : ''}>Ver gastos</button>
        <button onClick={() => setActiveTab('comparePrices')} className={activeTab === 'comparePrices' ? 'active': ''}>Comparar Precios</button>
        <button onClick={() => setActiveTab('addStore')} className={activeTab === 'addStore' ? 'active' : ''}>Agregar Tienda</button>
        <button onClick={() => setActiveTab('addProduct')} className={activeTab === 'addProduct' ? 'active' : ''}>Agregar Producto</button>
      </nav>

      <div className="tab-content">
        {activeTab === 'registerExpense' && (
          <section>
            <h2>Registrar Nuevo Gasto</h2>
            <form onSubmit={handleRegisterExpense}>
              <label>
                Tienda:
                <select value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)} required>
                  <option value="">Selecciona una tienda</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Fecha:
                <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required/>
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
                    <input type="number" value={item.quantity} min="1" onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))} required />
                  </label>
                  <label>
                    Precio Unitario:
                    <input type="number" value={item.unitPrice} step="0.01" min="0.01" onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))} required/>
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
        )}

        {activeTab ==='viewExpenses' && (
          <section>
            <h2>Historial de Gastos</h2>
            {expenses.length === 0 ? (
              <p>No hay gastos registrados aún.</p>
            ) : (
              <ul className="expense-list">
                {expenses.map(expense => (
                  <li key={expense.expense_id}>
                    <h3>Tienda: {expense.store_name} ({expense.store_address})</h3>
                    <p>Fecha: {new Date(expense.expense_date).toLocaleDateString()}</p>
                    <p>Monto Total: ${expense.total_amount}</p>
                    <h4>Productos:</h4>
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
        )}

        {activeTab === 'comparePrices' && (
          <section>
            <h2>Comparar PRecios de Productos</h2>
            <label>
              Selecciona un Producto:
              <select value = {comparisonProductId} onChange={(e) => setComparisonProductId(e.target.value)}>
                <option value="">Selecciona un producto</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
            </label>
            <button onClick={handleComparePrices}>Comparar</button>

            {comparisonResults.length > 0 && (
              <div>
                <h3>Resultados de Comparación para {products.find(p => p.id == comparisonProductId)?.name}:</h3>
                <ul className="price-comparison-list">
                  {comparisonResults.map((result, index) => (
                    <li key={index}>
                      Tienda: {result.store_name} - Precio: ${result.unit_price} - Fecha: {new Date(result.expense_date).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {comparisonProductId && comparisonResults.length === 0 && (
              <p>No se encontraron precios para este producto</p>
            )}
          </section>
        )}

        {activeTab === 'addStore' && (
          <section>
            <h2>Agregar Nueva Tienda</h2>
            <form onSubmit={handleAddStore}>
              <label>
                Nombre de la Tienda
                <input type="text" value={newStoreName} onChange={(e) => setNewStoreName(e.target.value)}/>
              </label>
              <label>
                Dirección (Opcional):
                <input type="text"value={newStoreAddress} onChange={(e) => setNewStoreAddress(e.target.value)} />
              </label>
              <button type="submit">Agregar Tienda</button>
            </form>
          </section>
        )}

        {activeTab === 'addProduct' && (
          <section>
            <h2>Agregar Nuevo Producto</h2>
            <form onSubmit={handleAddProduct}>
              <label>
                Nombre del Producto:
                <input type="text" value={newProductName} onChange={(e) => setNewProdcutName(e.target.value)} required /> 
              </label>
              <label>
                Descripción (Opcional):
                <textarea value={newProductDescription} onChange={(e) => setNewProductDescription(e.target.value)}></textarea>
              </label>
              <button type="submit">Agregar Producto</button>
            </form>
          </section>
        )}
      </div>
    </div>
  )
}

export default App
