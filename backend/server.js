const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const app = express();

app.use(cors());
app.use(express.json());
app.use('/images', express.static(__dirname + '/public/images'));


// MySQL 连接配置
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Hsk199912097419',
  database: 'smartbuyhub'
});

db.connect((err) => {
  if (err) {
    console.error('❌ 数据库连接失败:', err);
    process.exit(1);
  }
  console.log('✅ MySQL connected');
});

// 获取商品列表
app.get('/api/products', (req, res) => {
  db.query('SELECT * FROM products', (err, results) => {
    if (err) {
      console.error('❌ 查询失败:', err);
      return res.status(500).json({ error: '查询失败' });
    }
    res.json(results);
  });
});

// 用户注册
app.post('/api/register', (req, res) => {
  const { email, password } = req.body;
  db.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, password], (err, results) => {
    if (err) {
      console.error('❌ 注册失败:', err);
      return res.status(500).json({ error: '注册失败' });
    }
    res.json({ id: results.insertId, email });
  });
});

// 用户登录
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, results) => {
    if (err) {
      console.error('❌ 登录失败:', err);
      return res.status(500).json({ error: '登录失败' });
    }
    if (results.length > 0) {
      res.json({ success: true, userId: results[0].id });
    } else {
      res.status(401).json({ success: false });
    }
  });
});

// 添加收藏
app.post('/api/favorite', (req, res) => {
  const { userId, productId } = req.body;
  db.query('INSERT INTO favorites (user_id, product_id) VALUES (?, ?)', [userId, productId], (err) => {
    if (err) {
      console.error('❌ 收藏失败:', err);
      return res.status(500).json({ error: '收藏失败' });
    }
    res.json({ success: true });
  });
});

// 获取收藏
app.get('/api/favorite/:userId', (req, res) => {
  const { userId } = req.params;
  db.query('SELECT product_id FROM favorites WHERE user_id = ?', [userId], (err, results) => {
    if (err) {
      console.error('❌ 获取收藏失败:', err);
      return res.status(500).json({ error: '获取失败' });
    }
    res.json(results);
  });
});

app.listen(5000, () => {
  console.log('✅ Server running on http://localhost:5000');
});

// 获取用户收藏的完整商品信息
app.get('/api/favorite/details/:userId', (req, res) => {
  const userId = req.params.userId;
  const sql = `
    SELECT p.id, p.title, p.price, p.image
    FROM favorites f
    JOIN products p ON f.product_id = p.id
    WHERE f.user_id = ?
  `;
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('❌ 获取收藏详情失败:', err);
      return res.status(500).json({ error: '收藏详情获取失败' });
    }
    res.json(results);
  });
});

// 删除收藏商品接口
app.delete('/api/favorite', (req, res) => {
  const { userId, productId } = req.body;
  db.query(
    'DELETE FROM favorites WHERE user_id = ? AND product_id = ?',
    [userId, productId],
    (err) => {
      if (err) {
        console.error('❌ 删除收藏失败:', err);
        return res.status(500).json({ error: '删除收藏失败' });
      }
      res.json({ success: true });
    }
  );
});

// 修改密码接口
app.post('/api/change-password', (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;
  db.query(
    'SELECT * FROM users WHERE id = ? AND password = ?',
    [userId, oldPassword],
    (err, results) => {
      if (err) return res.status(500).json({ error: '数据库查询失败' });
      if (results.length === 0) return res.status(400).json({ error: '原密码错误' });

      db.query(
        'UPDATE users SET password = ? WHERE id = ?',
        [newPassword, userId],
        (err2) => {
          if (err2) return res.status(500).json({ error: '密码更新失败' });
          res.json({ success: true });
        }
      );
    }
  );
});

// 获取单个产品详情
app.get('/api/products/:id', (req, res) => {
  const productId = req.params.id;
  const query = 'SELECT * FROM products WHERE id = ?';

  db.query(query, [productId], (err, results) => {
    if (err) {
      console.error('❌ 查询产品详情失败:', err);
      return res.status(500).json({ error: '查询失败' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: '未找到产品' });
    }
    res.json(results[0]);
  });
});
