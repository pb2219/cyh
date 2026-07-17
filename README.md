# 个人记账助手 (PBCXCYH)

> 基于 **uni-app (Vue3) + uniCloud (阿里云)** 的全栈个人财务管理小程序，支持收入/支出记录、月度统计、分类管理等功能。

## 📋 项目介绍

个人记账助手是一款轻量级的财务管理工具，帮助你轻松记录每一笔收支。项目采用前后端分离架构，前端基于 uni-app 跨端框架，后端使用 uniCloud 阿里云 serverless 云函数 + MongoDB 数据库，实现快速开发与一键部署。

### 核心功能

- **月度概览**：查看当月总收入、总支出、结余，支持月份切换
- **记账功能**：支持添加收入/支出记录，包含金额、分类、日期、备注
- **分类排行**：按分类统计收支占比，可视化排行展示
- **账单管理**：账单列表支持按类型、月份筛选，支持分页加载和删除
- **分类管理**：支持自定义添加收支分类，预设常用分类

## 🛠 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | uni-app (Vue 3) |
| 开发工具 | HBuilder X |
| 后端服务 | uniCloud 阿里云 |
| 数据库 | 阿里云 MongoDB |
| 云函数 | uniCloud Cloud Functions (Node.js) |
| 版本管理 | Git (Gitcode) |

## 📁 项目结构

```
PBCXCYH/
├── pages/                    # 前端页面
│   ├── index/index.vue       # 首页 - 月度概览 & 分类排行
│   ├── add/add.vue           # 记账页 - 添加收支记录
│   ├── list/list.vue         # 账单页 - 账单列表 & 筛选
│   └── mine/mine.vue         # 我的 - 分类管理 & 关于
├── uniCloud-alipay/          # 云后台
│   ├── cloudfunctions/       # 云函数（后端 API）
│   │   ├── add-bill/         # 添加账单
│   │   ├── get-bills/        # 获取账单列表
│   │   ├── get-statistics/   # 获取统计数据
│   │   ├── delete-bill/      # 删除账单
│   │   ├── get-categories/   # 获取分类列表
│   │   └── add-category/     # 添加分类
│   └── database/             # 数据库 Schema
│       ├── bills.schema.json
│       └── categories.schema.json
├── pages.json                # 页面路由配置
├── manifest.json             # 应用配置
├── App.vue                   # 应用入口
└── main.js                   # 主入口
```

## 🚀 安装与运行指南

### 前置条件

1. 安装 [HBuilder X](https://www.dcloud.io/hbuilderx.html) 开发工具
2. 注册并登录 HBuilder X，关联阿里云服务空间
3. 项目已关联 Gitcode 仓库

### 本地运行步骤

1. **克隆项目**
   ```bash
   git clone <你的Gitcode仓库地址>
   ```

2. **使用 HBuilder X 打开项目**
   - 启动 HBuilder X → 文件 → 导入 → 从本地目录导入
   - 选择项目根目录

3. **关联云服务空间**
   - 右键 `uniCloud-alipay` 目录 → 关联云服务空间
   - 选择你的阿里云服务空间

4. **上传云函数**
   - 右键每个云函数目录 → 上传部署
   - 或全选云函数批量上传

5. **初始化数据库**
   - 在 uniCloud 控制台创建 `bills` 和 `categories` 集合
   - 或右键 `database` 目录下的 schema 文件 → 上传 DB Schema

6. **运行项目**
   - 点击 HBuilder X 工具栏 → 运行 → 运行到浏览器 (H5)
   - 或运行到微信/支付宝小程序模拟器

### 线上部署

通过 HBuilder X 的「发行」功能：
- **H5 版**：发行 → 网站-H5手机版 → 上传至云空间前端托管
- **小程序版**：发行 → 对应平台的小程序

## 📡 API 接口文档

所有接口通过 `uniCloud.callFunction()` 调用，云函数名即为 API 端点。

### 1. add-bill - 添加账单

- **云函数名**: `add-bill`
- **请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | String | 是 | `income` 或 `expense` |
| amount | Number | 是 | 金额，必须 > 0 |
| category | String | 是 | 分类名称 |
| date | String | 是 | 日期，格式 YYYY-MM-DD |
| remark | String | 否 | 备注，默认为空 |

- **返回示例**:
```json
{
  "code": 0,
  "data": { "id": "记录ID" },
  "message": "添加成功"
}
```

### 2. get-bills - 获取账单列表

- **云函数名**: `get-bills`
- **请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | String | 否 | `income` / `expense`，不传返回全部 |
| month | String | 否 | 月份筛选，格式 YYYY-MM |
| page | Number | 否 | 页码，默认 1 |
| pageSize | Number | 否 | 每页条数，默认 20 |

- **返回示例**:
```json
{
  "code": 0,
  "data": {
    "list": [{ "_id": "...", "type": "expense", "amount": 35.5, "category": "餐饮", "date": "2026-07-15", "remark": "午餐" }],
    "total": 42,
    "page": 1,
    "pageSize": 20
  },
  "message": "success"
}
```

### 3. get-statistics - 获取统计数据

- **云函数名**: `get-statistics`
- **请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| month | String | 否 | 月份，格式 YYYY-MM，默认当前月 |

- **返回示例**:
```json
{
  "code": 0,
  "data": {
    "month": "2026-07",
    "totalIncome": 15000,
    "totalExpense": 8500.5,
    "balance": 6499.5,
    "billCount": 28,
    "categoryBreakdown": [
      { "category": "餐饮", "income": 0, "expense": 3200 },
      { "category": "工资", "income": 15000, "expense": 0 }
    ]
  },
  "message": "success"
}
```

### 4. delete-bill - 删除账单

- **云函数名**: `delete-bill`
- **请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | String | 是 | 账单记录 _id |

- **返回示例**:
```json
{ "code": 0, "data": { "deleted": 1 }, "message": "删除成功" }
```

### 5. get-categories - 获取分类列表

- **云函数名**: `get-categories`
- **请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | String | 否 | `income` / `expense`，不传返回全部 |

- **返回示例**:
```json
{
  "code": 0,
  "data": [
    { "_id": "...", "name": "餐饮", "type": "expense", "icon": "🍜", "sort": 1 }
  ],
  "message": "success"
}
```

### 6. add-category - 添加分类

- **云函数名**: `add-category`
- **请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | String | 是 | 分类名称 |
| type | String | 是 | `income` / `expense` |
| icon | String | 否 | 图标 emoji，默认 📌 |

- **返回示例**:
```json
{ "code": 0, "data": { "id": "..." }, "message": "添加成功" }
```

### 错误码说明

| code | 说明 |
|------|------|
| 0 | 成功 |
| 400 | 参数错误 |
| 404 | 记录不存在 |
| 409 | 资源冲突（如分类重名） |
| 500 | 服务器内部错误 |

## 🗄 数据库设计

### bills 集合（账单表）

| 字段 | 类型 | 说明 |
|------|------|------|
| _id | String | 记录 ID (自动生成) |
| type | String | income / expense |
| amount | Double | 金额 |
| category | String | 分类名称 |
| date | String | 日期 YYYY-MM-DD |
| remark | String | 备注 |
| createTime | Timestamp | 创建时间 (自动) |

### categories 集合（分类表）

| 字段 | 类型 | 说明 |
|------|------|------|
| _id | String | 记录 ID (自动生成) |
| name | String | 分类名称 |
| type | String | income / expense |
| icon | String | 图标 emoji |
| sort | Int | 排序权重 |

## 📝 开发历程

- 2026-07-15: 项目初始化，搭建 uni-app + uniCloud 架构
- 2026-07-16: 完成数据库 Schema 设计和 6 个云函数开发
- 2026-07-17: 完成 4 个前端页面开发和联调测试
- 后续: 部署上线，文档完善

## 📄 License

本项目仅用于学习与实训考核用途。
