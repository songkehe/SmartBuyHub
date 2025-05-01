const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const fetch = require('node-fetch').default;

const app = express();
app.use(cors());
app.use(express.json());

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

// 商品中转接口
app.get('/api/products', async (req, res) => {
  try {
    const response = await fetch('https://fakestoreapi.com/products');
    console.log('状态码:', response.status); // ✅ 调试用
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('❌ 商品获取失败:', err);
    res.status(500).json({ error: '商品加载失败' });
  }
});

// 用户注册接口
app.post('/api/register', (req, res) => {
  const { email, password } = req.body;
  db.query(
    'INSERT INTO users (email, password) VALUES (?, ?)',
    [email, password],
    (err, results) => {
      if (err) {
        console.error('❌ 注册失败:', err);
        return res.status(500).json({ error: '注册失败' });
      }
      res.json({ id: results.insertId, email });
    }
  );
});

// 用户登录接口
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.query(
    'SELECT * FROM users WHERE email = ? AND password = ?',
    [email, password],
    (err, results) => {
      if (err) {
        console.error('❌ 登录失败:', err);
        return res.status(500).json({ error: '登录失败' });
      }
      if (results.length > 0) {
        res.json({ success: true, userId: results[0].id });
      } else {
        res.status(401).json({ success: false, message: '账号或密码错误' });
      }
    }
  );
});

// 收藏商品接口
app.post('/api/favorite', (req, res) => {
  const { userId, productId } = req.body;
  db.query(
    'INSERT INTO favorites (user_id, product_id) VALUES (?, ?)',
    [userId, productId],
    (err) => {
      if (err) {
        console.error('❌ 收藏失败:', err);
        return res.status(500).json({ error: '收藏失败' });
      }
      res.json({ success: true });
    }
  );
});

// 获取用户收藏商品
app.get('/api/favorite/:userId', (req, res) => {
  const userId = req.params.userId;
  db.query(
    'SELECT product_id FROM favorites WHERE user_id = ?',
    [userId],
    (err, results) => {
      if (err) {
        console.error('❌ 获取收藏失败:', err);
        return res.status(500).json({ error: '收藏获取失败' });
      }
      res.json(results);
    }
  );
});

// 启动服务
app.listen(5000, () => {
  console.log('✅ Server running on http://localhost:5000');
});
