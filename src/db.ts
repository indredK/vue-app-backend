import { Pool } from 'pg';
import { dbConfig } from './config/db';

export const pool = new Pool({
  database: dbConfig.database,
  user: dbConfig.user,
  password: dbConfig.password,
  host: dbConfig.host,
  port: dbConfig.port,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const query = async (text: string, params?: any[]) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

export interface Goods {
  id: number;
  name: string;
  price: number;
  image: string;
  sales: number;
  specs: { brand: string; model: string; storage: string; color: string; warranty: string };
  description: string;
  tags: string[];
}

export interface User {
  id: number;
  avatar: string;
  nickname: string;
  phone: string;
  email: string;
}

export interface CartItem {
  id: number;
  userId: number;
  goodsId: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  selected: boolean;
}

export interface Order {
  id: number;
  userId: number;
  orderNo: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: number;
  orderId: number;
  goodsId: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

const goodsList: Goods[] = [
  { id: 1, name: 'iPhone 15 Pro', price: 7999, image: 'https://picsum.photos/400/400?random=1', sales: 5200, specs: { brand: 'Apple', model: 'A3104', storage: '256GB', color: '钛金属', warranty: '1年' }, description: '采用航空级钛金属设计，A17 Pro芯片，专业相机系统，全新操作按钮。', tags: ['热销', '旗舰'] },
  { id: 2, name: 'MacBook Pro 14', price: 14999, image: 'https://picsum.photos/400/400?random=2', sales: 3200, specs: { brand: 'Apple', model: 'MKGR3CH', storage: '512GB SSD', color: '深空灰', warranty: '1年' }, description: '强劲M3 Pro芯片，14英寸Liquid Retina XDR显示屏，续航最长22小时。', tags: ['专业', '高性能'] },
  { id: 3, name: 'AirPods Pro', price: 1999, image: 'https://picsum.photos/400/400?random=3', sales: 8900, specs: { brand: 'Apple', model: 'MTJV3CH', storage: '-', color: '白色', warranty: '1年' }, description: '主动降噪，空间音频，MagSafe充电盒，续航可达30小时。', tags: ['爆款', '降噪'] },
  { id: 4, name: 'iPad Air', price: 4599, image: 'https://picsum.photos/400/400?random=4', sales: 4100, specs: { brand: 'Apple', model: 'MQ6V3CH', storage: '256GB', color: '星光色', warranty: '1年' }, description: 'M1芯片，10.9英寸Liquid Retina显示屏，支持Apple Pencil。', tags: ['新品', '生产力'] },
  { id: 5, name: 'Apple Watch', price: 2999, image: 'https://picsum.photos/400/400?random=5', sales: 6700, specs: { brand: 'Apple', model: 'MR972CH', storage: '-', color: '午夜色', warranty: '1年' }, description: '全天候视网膜显示屏，健康监测功能，续航18小时。', tags: ['健康', '智能'] },
  { id: 6, name: 'AirPods Max', price: 3999, image: 'https://picsum.photos/400/400?random=6', sales: 2100, specs: { brand: 'Apple', model: 'MGY53CH', storage: '-', color: '深空灰', warranty: '1年' }, description: '头戴式主动降噪耳机，H1芯片，空间音频，续航20小时。', tags: ['旗舰', 'Hi-Fi'] },
  { id: 7, name: 'iPhone 15', price: 5999, image: 'https://picsum.photos/400/400?random=7', sales: 7800, specs: { brand: 'Apple', model: 'A3084', storage: '128GB', color: '蓝色', warranty: '1年' }, description: 'A16仿生芯片，4800万像素主摄，USB-C接口。', tags: ['爆款', '性价比'] },
  { id: 8, name: 'iPad Pro 12.9', price: 9999, image: 'https://picsum.photos/400/400?random=8', sales: 2800, specs: { brand: 'Apple', model: 'MXDWCH', storage: '1TB', color: '银色', warranty: '1年' }, description: 'M2芯片，12.9英寸Liquid Retina XDR，支持Face ID。', tags: ['旗舰', '专业'] },
];

const users: User[] = [
  { id: 1, avatar: 'https://picsum.photos/200/200?random=10', nickname: '科技极客', phone: '138****8888', email: 'tech@example.com' }
];

let cartItems: CartItem[] = [];
let orders: Order[] = [];
let cartIdCounter = 1;
let orderIdCounter = 1;
let orderItemIdCounter = 1;

export const getGoodsList = () => goodsList;
export const getGoodsById = (id: number) => goodsList.find(g => g.id === id);
export const getGoodsByIds = (ids: number[]) => goodsList.filter(g => ids.includes(g.id));

export const getUserById = (id: number) => users.find(u => u.id === id);
export const updateUser = (id: number, data: Partial<User>) => {
  const user = users.find(u => u.id === id);
  if (user) {
    Object.assign(user, data);
  }
  return user;
};

export const getCartItems = (userId: number) => cartItems.filter(c => c.userId === userId);
export const addCartItem = (item: Omit<CartItem, 'id'>) => {
  const existing = cartItems.find(c => c.userId === item.userId && c.goodsId === item.goodsId);
  if (existing) {
    existing.quantity += item.quantity;
    return existing;
  }
  const newItem = { ...item, id: cartIdCounter++ };
  cartItems.push(newItem);
  return newItem;
};
export const updateCartItem = (id: number, data: Partial<CartItem>) => {
  const item = cartItems.find(c => c.id === id);
  if (item) {
    Object.assign(item, data);
  }
  return item;
};
export const removeCartItem = (id: number) => {
  const index = cartItems.findIndex(c => c.id === id);
  if (index > -1) {
    cartItems.splice(index, 1);
    return true;
  }
  return false;
};
export const clearCart = (userId: number) => {
  cartItems = cartItems.filter(c => c.userId !== userId);
};

export const createOrder = (userId: number, items: any[], totalAmount: number) => {
  const order: Order = {
    id: orderIdCounter++,
    userId,
    orderNo: `ORDER${Date.now()}${Math.floor(Math.random() * 1000)}`,
    totalAmount,
    status: 'pending',
    createdAt: new Date().toISOString(),
    items: []
  };
  
  for (const item of items) {
    order.items.push({
      id: orderItemIdCounter++,
      orderId: order.id,
      goodsId: item.goodsId,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: item.quantity
    });
    
    const goods = goodsList.find(g => g.id === item.goodsId);
    if (goods) {
      goods.sales += item.quantity;
    }
  }
  
  orders.push(order);
  cartItems = cartItems.filter(c => c.userId !== userId || !c.selected);
  
  return order;
};

export const getOrders = (userId: number) => orders.filter(o => o.userId === userId);
export const getOrderById = (id: number) => orders.find(o => o.id === id);
export const updateOrderStatus = (id: number, status: string) => {
  const order = orders.find(o => o.id === id);
  if (order) {
    order.status = status;
  }
  return order;
};
