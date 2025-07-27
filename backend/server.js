const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); //habilita el parseo de JSON en el cuerpo de las consultas

pool.query('SELECT NOW()', (err, res) => {
  if (err){
    console.error('Error al conectar con la base de datos', err.message);
  } else {
    console.log('Conexión a PostgreSQL exitoso', pool)
  }
})

// Rutas API

// Obtener todas las tiendas
app.get('/api/stores', async(req, res) =>{
  try{
    const result = await pool.query('SELECT * FROM stores ORDER BY name ASC');
    res.json(result.rows)
  } catch (err) {
    console.error('Error fetching stores:', err);
    res.status(500).json({ error: 'Internal server error'});
  }
});

// Crear una nueva tienda
app.post('/api/stores', async (req, res) => {
  const {name, address} = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO stores (name, address) VALUES ($1, $2) RETURNING *',
      [name, address]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Error creating store:', err);
    res.status(500).json({ error: 'Internal server error'})
  }
});

// Obtener todos los productos
app.get('/api/products', async (req, res) => {
  try{
    const result = await pool.query('SELECT * FROM products ORDER BY name ASC');
    res.json(result.rows)
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Internal server erroneo' })
  }
});

// Crear un nuevo producto
app.post('/api/products', async (req, res) => {
  const {name, description} = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO products (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING RETURNING *',
      [name, description]
    );
    if (result.rows.length === 0) {
      return res.status(409).json({ message: 'Product with this name already exists.'});
    }
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Registrar un nuevo gasto completo (incluyendo items)
app.post('/api/expenses', async (req, res) => {
  const { store_id, expense_date, total_amount, items } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN'); // Iniciar transacción

    //Insertar el gasto principal
    const expenseResult = await client.query(
      'INSERT INTO expenses (store_id, expense_date, total_amount) VALUES ($1, $2, $3) RETURNING id',
      [store_id, expense_date, total_amount]
    );
    const expenseId = expenseResult.rows[0].id
    //Insertar los items del gasto
    for (const item of items) {
      await client.query(
          'INSERT INTO expense_items (expense_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
          [expenseId, item.product_id, item.quantity, item.unit_price]
      )
    }

    await client.query('COMMIT'); //Confirma transacción
    res.status(201).json({ message: 'Expense recorded successfully', expense_id: expenseId});
  } catch (err){
    await client.query('ROLLBACK'); //Revertir transacción en caso de error
    console.error( 'Error recording expense:', err );
    res.status(500).json({ error: 'Internal server error', details: err.message })
  } finally {
    client.release()
  }
});

// Obtener todos los gastos con detalles
app.get('/api/expenses', async (req, res) => {
  try {
    const query = ` SELECT
        e.id AS expense_id,
          e.expense_date,
          e.total_amount,
          s.name AS store_name,
          s.address AS store_address,
          json_agg(
            json_build_object(
              'item_id', ei.id,
              'product_id', p.id,
              'product_name', p.name,
              'quantity', ei.quantity,
              'unit_price', ei.unit_price
            )
          ) AS items
      FROM
          expenses e
      JOIN
          stores s ON e.store_id = s.id
      JOIN
          expense_items ei ON e.id = ei.expense_id
      JOIN
          products p ON ei.product_id = p.id
      GROUP BY
          e.id, s.name, s.address
      ORDER BY
          e.expense_date DESC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.log('Error fetching expenses:', err);
    res.status(500).json({ error: ' Internal server error' });
  }
});

// Comparar precios de un producto especifico entre tiendas
app.get('/api/compare-product-prices/:productId', async (req, res) => {
  const { productId } = req.params;
  try {
    const query =  `
      WITH ProductPricesRanked AS(
        SELECT 
          p.name AS product_name,
          s.name AS store_name,
          ei.unit_price,
          e.expense_date,
          ROW_NUMBER() OVER (PARTITION BY p.id, s.id ORDER BY e.expense_date DESC, e.id DESC) as rn
        FROM
          expense_items ei
        JOIN
          products p ON ei.product_id = p.id
        JOIN
          expenses e ON ei.expense_id = e.id
        JOIN
          stores s ON e.store_id = s.id
        WHERE
          p.id = $1
      )

      SELECT
        product_name,
        store_name,
        unit_price,
        expense_date
      FROM
        ProductPricesRanked
      WHERE
        rn = 1
      ORDER BY
          product_name ASC, store_name ASC;
    `;
    const result = await pool.query(query, [productId]);
    console.log('Resultado:', result)
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No prices found for this product.'})
    }
    res.json(result.rows)
  } catch (err) {
    console.error('Error comparing product prices:', err);
    res.status(500).json({ error: 'Internal serfver error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});