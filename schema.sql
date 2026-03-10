-- 创建数据库
-- CREATE DATABASE shop_mini_app;

-- 用户表（增强版）
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar VARCHAR(500) DEFAULT '',
    nickname VARCHAR(100) NOT NULL DEFAULT '用户',
    phone VARCHAR(20) DEFAULT '',
    email VARCHAR(100) DEFAULT '',
    role_id INTEGER DEFAULT 2,
    points INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 角色表
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT DEFAULT '',
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 商品分类表
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    parent_id INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    icon VARCHAR(500) DEFAULT '',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 商品表（增强版）
CREATE TABLE IF NOT EXISTS goods (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2),
    image VARCHAR(500) DEFAULT '',
    images JSONB DEFAULT '[]',
    sales INTEGER DEFAULT 0,
    stock INTEGER DEFAULT 0,
    specs JSONB DEFAULT '{}',
    description TEXT DEFAULT '',
    tags JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'active',
    is_hot BOOLEAN DEFAULT false,
    is_new BOOLEAN DEFAULT false,
    is_recommend BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 商品评价表
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    goods_id INTEGER REFERENCES goods(id) ON DELETE CASCADE,
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    content TEXT DEFAULT '',
    images JSONB DEFAULT '[]',
    reply TEXT DEFAULT '',
    reply_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 商品收藏表
CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    goods_id INTEGER REFERENCES goods(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, goods_id)
);

-- 购物车表
CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    goods_id INTEGER REFERENCES goods(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    image VARCHAR(500) DEFAULT '',
    quantity INTEGER DEFAULT 1,
    selected BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 收货地址表
CREATE TABLE IF NOT EXISTS addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    receiver_name VARCHAR(50) NOT NULL,
    receiver_phone VARCHAR(20) NOT NULL,
    province VARCHAR(50) NOT NULL,
    city VARCHAR(50) NOT NULL,
    district VARCHAR(50) NOT NULL,
    detail_address VARCHAR(200) NOT NULL,
    postal_code VARCHAR(20) DEFAULT '',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 订单表（增强版）
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    order_no VARCHAR(50) UNIQUE NOT NULL,
    address_id INTEGER REFERENCES addresses(id) ON DELETE SET NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    points_used INTEGER DEFAULT 0,
    points_discount DECIMAL(10, 2) DEFAULT 0,
    final_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    payment_status VARCHAR(20) DEFAULT 'unpaid',
    payment_method VARCHAR(50) DEFAULT '',
    payment_time TIMESTAMP,
    shipping_time TIMESTAMP,
    received_time TIMESTAMP,
    cancel_reason TEXT DEFAULT '',
    remark TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 订单明细表
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    goods_id INTEGER REFERENCES goods(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    image VARCHAR(500) DEFAULT '',
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 订单状态历史表
CREATE TABLE IF NOT EXISTS order_status_history (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    remark TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 支付方式表
CREATE TABLE IF NOT EXISTS payment_methods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    icon VARCHAR(500) DEFAULT '',
    status VARCHAR(20) DEFAULT 'active',
    config JSONB DEFAULT '{}',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 支付记录表
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    payment_method_id INTEGER REFERENCES payment_methods(id) ON DELETE SET NULL,
    transaction_id VARCHAR(100) UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    callback_data JSONB DEFAULT '{}',
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 积分记录表
CREATE TABLE IF NOT EXISTS points_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    amount INTEGER NOT NULL,
    balance INTEGER NOT NULL,
    description TEXT DEFAULT '',
    related_type VARCHAR(50) DEFAULT '',
    related_id INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 通知表
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT DEFAULT '',
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 系统日志表
CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    module VARCHAR(50) NOT NULL,
    ip VARCHAR(50) DEFAULT '',
    user_agent TEXT DEFAULT '',
    request_data JSONB DEFAULT '{}',
    response_data JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'success',
    error_message TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 统计数据表
CREATE TABLE IF NOT EXISTS statistics (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(type, date)
);

-- 插入默认角色
INSERT INTO roles (id, name, description, permissions) VALUES
(1, 'admin', '管理员', '["*"]'),
(2, 'user', '普通用户', '["goods:read", "cart:read", "cart:write", "order:read", "order:write", "address:read", "address:write", "review:read", "review:write", "favorite:read", "favorite:write", "notification:read"]')
ON CONFLICT (id) DO NOTHING;

-- 插入默认用户（密码: admin123）
INSERT INTO users (id, username, password_hash, avatar, nickname, phone, email, role_id, status) 
VALUES (1, 'admin', '$2b$10$77Pi.gZeuGvBBe0sZa11mu/gmxB8PFVuah5qA6VVHlYLGWuxfcOn2', 'https://picsum.photos/200/200?random=10', '管理员', '138****8888', 'admin@example.com', 1, 'active')
ON CONFLICT (id) DO NOTHING;

-- 插入默认用户（密码: user123）
INSERT INTO users (id, username, password_hash, avatar, nickname, phone, email, role_id, status) 
VALUES (2, 'user', '$2b$10$BkvR4uL42xP0IHkgY7Klh.ZSxI/h8mrnwFLNAMi9DMMUUe6yspId2', 'https://picsum.photos/200/200?random=11', '科技极客', '138****9999', 'user@example.com', 2, 'active')
ON CONFLICT (id) DO NOTHING;

-- 插入商品分类
INSERT INTO categories (id, name, parent_id, sort_order, icon) VALUES
(1, '手机数码', 0, 1, 'phone'),
(2, '电脑办公', 0, 2, 'computer'),
(3, '智能穿戴', 0, 3, 'watch'),
(4, '平板电脑', 1, 1, 'tablet'),
(5, '耳机音响', 1, 2, 'headphone')
ON CONFLICT (id) DO NOTHING;

-- 插入支付方式
INSERT INTO payment_methods (id, name, code, icon, status, sort_order) VALUES
(1, '支付宝', 'alipay', 'https://example.com/alipay.png', 'active', 1),
(2, '微信支付', 'wechat', 'https://example.com/wechat.png', 'active', 2),
(3, '余额支付', 'balance', 'https://example.com/balance.png', 'active', 3)
ON CONFLICT (id) DO NOTHING;

-- 插入商品数据
INSERT INTO goods (id, category_id, name, price, original_price, image, images, sales, stock, specs, description, tags, status, is_hot, is_new, is_recommend) VALUES
(1, 4, 'iPhone 15 Pro', 7999, 8999, 'https://picsum.photos/400/400?random=1', '["https://picsum.photos/400/400?random=1", "https://picsum.photos/400/400?random=11"]', 5200, 100, 
 '{"brand": "Apple", "model": "A3104", "storage": "256GB", "color": "钛金属", "warranty": "1年"}',
 '采用航空级钛金属设计，A17 Pro芯片，专业相机系统，全新操作按钮。',
 '["热销", "旗舰"]', 'active', true, true, true),

(2, 2, 'MacBook Pro 14', 14999, 16999, 'https://picsum.photos/400/400?random=2', '["https://picsum.photos/400/400?random=2", "https://picsum.photos/400/400?random=12"]', 3200, 50,
 '{"brand": "Apple", "model": "MKGR3CH", "storage": "512GB SSD", "color": "深空灰", "warranty": "1年"}',
 '强劲M3 Pro芯片，14英寸Liquid Retina XDR显示屏，续航最长22小时。',
 '["专业", "高性能"]', 'active', false, true, true),

(3, 5, 'AirPods Pro', 1999, 2299, 'https://picsum.photos/400/400?random=3', '["https://picsum.photos/400/400?random=3", "https://picsum.photos/400/400?random=13"]', 8900, 200,
 '{"brand": "Apple", "model": "MTJV3CH", "storage": "-", "color": "白色", "warranty": "1年"}',
 '主动降噪，空间音频，MagSafe充电盒，续航可达30小时。',
 '["爆款", "降噪"]', 'active', true, false, true),

(4, 4, 'iPad Air', 4599, 4999, 'https://picsum.photos/400/400?random=4', '["https://picsum.photos/400/400?random=4", "https://picsum.photos/400/400?random=14"]', 4100, 150,
 '{"brand": "Apple", "model": "MQ6V3CH", "storage": "256GB", "color": "星光色", "warranty": "1年"}',
 'M1芯片，10.9英寸Liquid Retina显示屏，支持Apple Pencil。',
 '["新品", "生产力"]', 'active', false, true, false),

(5, 3, 'Apple Watch', 2999, 3299, 'https://picsum.photos/400/400?random=5', '["https://picsum.photos/400/400?random=5", "https://picsum.photos/400/400?random=15"]', 6700, 180,
 '{"brand": "Apple", "model": "MR972CH", "storage": "-", "color": "午夜色", "warranty": "1年"}',
 '全天候视网膜显示屏，健康监测功能，续航18小时。',
 '["健康", "智能"]', 'active', true, false, true),

(6, 5, 'AirPods Max', 3999, 4399, 'https://picsum.photos/400/400?random=6', '["https://picsum.photos/400/400?random=6", "https://picsum.photos/400/400?random=16"]', 2100, 80,
 '{"brand": "Apple", "model": "MGY53CH", "storage": "-", "color": "深空灰", "warranty": "1年"}',
 '头戴式主动降噪耳机，H1芯片，空间音频，续航20小时。',
 '["旗舰", "Hi-Fi"]', 'active', false, false, true),

(7, 4, 'iPhone 15', 5999, 6499, 'https://picsum.photos/400/400?random=7', '["https://picsum.photos/400/400?random=7", "https://picsum.photos/400/400?random=17"]', 7800, 300,
 '{"brand": "Apple", "model": "A3084", "storage": "128GB", "color": "蓝色", "warranty": "1年"}',
 'A16仿生芯片，4800万像素主摄，USB-C接口。',
 '["爆款", "性价比"]', 'active', true, false, true),

(8, 4, 'iPad Pro 12.9', 9999, 10999, 'https://picsum.photos/400/400?random=8', '["https://picsum.photos/400/400?random=8", "https://picsum.photos/400/400?random=18"]', 2800, 60,
 '{"brand": "Apple", "model": "MXDWCH", "storage": "1TB", "color": "银色", "warranty": "1年"}',
 'M2芯片，12.9英寸Liquid Retina XDR，支持Face ID。',
 '["旗舰", "专业"]', 'active', false, true, false)
ON CONFLICT (id) DO NOTHING;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_goods_category ON goods(category_id);
CREATE INDEX IF NOT EXISTS idx_goods_status ON goods(status);
CREATE INDEX IF NOT EXISTS idx_goods_hot ON goods(is_hot);
CREATE INDEX IF NOT EXISTS idx_goods_new ON goods(is_new);
CREATE INDEX IF NOT EXISTS idx_goods_recommend ON goods(is_recommend);
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_reviews_goods ON reviews(goods_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_goods ON favorites(goods_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_points_user ON points_records(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_user ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_created ON system_logs(created_at);
