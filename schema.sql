-- 创建数据库
-- CREATE DATABASE shop_mini_app;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    avatar VARCHAR(500) DEFAULT '',
    nickname VARCHAR(100) NOT NULL DEFAULT '用户',
    phone VARCHAR(20) DEFAULT '',
    email VARCHAR(100) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 商品表
CREATE TABLE IF NOT EXISTS goods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    image VARCHAR(500) DEFAULT '',
    sales INTEGER DEFAULT 0,
    specs JSONB DEFAULT '{}',
    description TEXT DEFAULT '',
    tags JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    order_no VARCHAR(50) UNIQUE NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
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

-- 插入默认用户
INSERT INTO users (id, avatar, nickname, phone, email) 
VALUES (1, 'https://picsum.photos/200/200?random=10', '科技极客', '138****8888', 'tech@example.com')
ON CONFLICT (id) DO NOTHING;

-- 插入商品数据
INSERT INTO goods (id, name, price, image, sales, specs, description, tags) VALUES
(1, 'iPhone 15 Pro', 7999, 'https://picsum.photos/400/400?random=1', 5200, 
 '{"brand": "Apple", "model": "A3104", "storage": "256GB", "color": "钛金属", "warranty": "1年"}',
 '采用航空级钛金属设计，A17 Pro芯片，专业相机系统，全新操作按钮。',
 '["热销", "旗舰"]'),

(2, 'MacBook Pro 14', 14999, 'https://picsum.photos/400/400?random=2', 3200,
 '{"brand": "Apple", "model": "MKGR3CH", "storage": "512GB SSD", "color": "深空灰", "warranty": "1年"}',
 '强劲M3 Pro芯片，14英寸Liquid Retina XDR显示屏，续航最长22小时。',
 '["专业", "高性能"]'),

(3, 'AirPods Pro', 1999, 'https://picsum.photos/400/400?random=3', 8900,
 '{"brand": "Apple", "model": "MTJV3CH", "storage": "-", "color": "白色", "warranty": "1年"}',
 '主动降噪，空间音频，MagSafe充电盒，续航可达30小时。',
 '["爆款", "降噪"]'),

(4, 'iPad Air', 4599, 'https://picsum.photos/400/400?random=4', 4100,
 '{"brand": "Apple", "model": "MQ6V3CH", "storage": "256GB", "color": "星光色", "warranty": "1年"}',
 'M1芯片，10.9英寸Liquid Retina显示屏，支持Apple Pencil。',
 '["新品", "生产力"]'),

(5, 'Apple Watch', 2999, 'https://picsum.photos/400/400?random=5', 6700,
 '{"brand": "Apple", "model": "MR972CH", "storage": "-", "color": "午夜色", "warranty": "1年"}',
 '全天候视网膜显示屏，健康监测功能，续航18小时。',
 '["健康", "智能"]'),

(6, 'AirPods Max', 3999, 'https://picsum.photos/400/400?random=6', 2100,
 '{"brand": "Apple", "model": "MGY53CH", "storage": "-", "color": "深空灰", "warranty": "1年"}',
 '头戴式主动降噪耳机，H1芯片，空间音频，续航20小时。',
 '["旗舰", "Hi-Fi"]'),

(7, 'iPhone 15', 5999, 'https://picsum.photos/400/400?random=7', 7800,
 '{"brand": "Apple", "model": "A3084", "storage": "128GB", "color": "蓝色", "warranty": "1年"}',
 'A16仿生芯片，4800万像素主摄，USB-C接口。',
 '["爆款", "性价比"]'),

(8, 'iPad Pro 12.9', 9999, 'https://picsum.photos/400/400?random=8', 2800,
 '{"brand": "Apple", "model": "MXDWCH", "storage": "1TB", "color": "银色", "warranty": "1年"}',
 'M2芯片，12.9英寸Liquid Retina XDR，支持Face ID。',
 '["旗舰", "专业"]')
ON CONFLICT (id) DO NOTHING;
