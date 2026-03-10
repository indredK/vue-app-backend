const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

let authToken = '';
let userId = 2;
let adminToken = '';
let adminUserId = 1;

const log = (title, data) => {
  console.log(`\n✅ ${title}`);
  console.log(JSON.stringify(data, null, 2));
};

const logError = (title, error) => {
  console.log(`\n❌ ${title}`);
  console.log(error.response?.data || error.message);
};

async function testAll() {
  try {
    console.log('🚀 开始测试商城后端功能...\n');

    await testServerInfo();
    await testAuth();
    await testCategories();
    await testGoods();
    await testCart();
    await testAddresses();
    await testOrders();
    await testReviews();
    await testFavorites();
    await testPoints();
    await testNotifications();
    await testStatistics();

    console.log('\n🎉 所有功能测试完成！');
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
  }
}

async function testServerInfo() {
  try {
    const response = await axios.get(`${BASE_URL}/`);
    log('服务器信息', response.data);
  } catch (error) {
    logError('服务器信息', error);
  }
}

async function testAuth() {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'user',
      password: 'user123'
    });
    authToken = response.data.token;
    userId = response.data.user.id;
    log('用户登录', response.data);
  } catch (error) {
    logError('用户登录', error);
  }

  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    adminToken = response.data.token;
    adminUserId = response.data.user.id;
    log('管理员登录', response.data);
  } catch (error) {
    logError('管理员登录', error);
  }
}

async function testCategories() {
  try {
    const response = await axios.get(`${BASE_URL}/api/categories`);
    log('商品分类列表', response.data);
  } catch (error) {
    logError('商品分类列表', error);
  }
}

async function testGoods() {
  try {
    const response = await axios.get(`${BASE_URL}/api/goods`);
    log('商品列表', { total: response.data.total, count: response.data.goods.length });
  } catch (error) {
    logError('商品列表', error);
  }

  try {
    const response = await axios.get(`${BASE_URL}/api/goods/hot`);
    log('热门商品', response.data);
  } catch (error) {
    logError('热门商品', error);
  }

  try {
    const response = await axios.get(`${BASE_URL}/api/goods/new`);
    log('新品', response.data);
  } catch (error) {
    logError('新品', error);
  }

  try {
    const response = await axios.get(`${BASE_URL}/api/goods/recommend`);
    log('推荐商品', response.data);
  } catch (error) {
    logError('推荐商品', error);
  }
}

async function testCart() {
  try {
    const response = await axios.get(`${BASE_URL}/api/cart/user/${userId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    log('购物车列表', response.data);
  } catch (error) {
    logError('购物车列表', error);
  }

  try {
    const response = await axios.post(`${BASE_URL}/api/cart`, {
      userId,
      goodsId: 1,
      name: 'iPhone 15 Pro',
      price: 7999,
      image: 'https://picsum.photos/400/400?random=1',
      quantity: 1
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    log('添加到购物车', response.data);
  } catch (error) {
    logError('添加到购物车', error);
  }
}

async function testAddresses() {
  try {
    const response = await axios.get(`${BASE_URL}/api/addresses/user/${userId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    log('地址列表', response.data);
  } catch (error) {
    logError('地址列表', error);
  }

  try {
    const response = await axios.post(`${BASE_URL}/api/addresses`, {
      userId,
      receiverName: '张三',
      receiverPhone: '13800138000',
      province: '北京市',
      city: '北京市',
      district: '朝阳区',
      detailAddress: '某某街道123号',
      postalCode: '100000',
      isDefault: true
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    log('添加地址', response.data);
  } catch (error) {
    logError('添加地址', error);
  }
}

async function testOrders() {
  try {
    const response = await axios.get(`${BASE_URL}/api/orders/user/${userId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    log('订单列表', response.data);
  } catch (error) {
    logError('订单列表', error);
  }
}

async function testReviews() {
  try {
    const response = await axios.get(`${BASE_URL}/api/reviews/goods/1`);
    log('商品评价', { total: response.data.total, count: response.data.reviews.length });
  } catch (error) {
    logError('商品评价', error);
  }
}

async function testFavorites() {
  try {
    const response = await axios.get(`${BASE_URL}/api/favorites/user/${userId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    log('收藏列表', response.data);
  } catch (error) {
    logError('收藏列表', error);
  }
}

async function testPoints() {
  try {
    const response = await axios.get(`${BASE_URL}/api/points/balance/${userId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    log('积分余额', response.data);
  } catch (error) {
    logError('积分余额', error);
  }
}

async function testNotifications() {
  try {
    const response = await axios.get(`${BASE_URL}/api/notifications/user/${userId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    log('通知列表', { total: response.data.total, count: response.data.notifications.length });
  } catch (error) {
    logError('通知列表', error);
  }
}

async function testStatistics() {
  try {
    const response = await axios.get(`${BASE_URL}/api/statistics/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    log('统计数据概览', {
      todayOrders: response.data.today.orders,
      totalUsers: response.data.totals.users,
      totalGoods: response.data.totals.goods
    });
  } catch (error) {
    logError('统计数据概览', error);
  }
}

testAll();
