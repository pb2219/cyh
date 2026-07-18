# AI Code Review 报告 — 个人记账助手

> 审查工具：AI 代码审查  
> 审查日期：2026-07-18  
> 项目：PBCXCYH（uni-app + uniCloud 阿里云）

---

## 一、总体评价

| 维度 | 评分 | 说明 |
|------|:--:|------|
| 代码结构 | ⭐⭐⭐⭐ | 前后端分离清晰，云函数职责单一，页面组件化合理 |
| 错误处理 | ⭐⭐⭐ | 大部分接口有 try/catch，但部分边界情况覆盖不足 |
| 代码复用 | ⭐⭐ | `getCategoryEmoji` 和 `formatMoney` 在 3 个页面中重复定义 |
| 性能 | ⭐⭐⭐ | 初始化分类采用串行插入，可改为并行；缺少缓存策略 |
| 安全性 | ⭐⭐⭐⭐ | 云函数有参数校验，金额范围验证，分类去重逻辑 |

**综合评分：3.2 / 5**

---

## 二、问题清单（按优先级排序）

### 🔴 高优先级

#### 1. `saveBill` 未使用 finally 重置状态

**文件**: `pages/add/add.vue`  
**位置**: 记账保存方法  
**问题**: `saving` 状态在 try/catch 之后重置，若发生同步 JS 异常则状态卡死，按钮永不可点击。

**建议**: 改用 `finally` 块：
```js
async saveBill() {
  this.saving = true
  try {
    // ... 保存逻辑
  } catch (e) {
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    this.saving = false
  }
}
```

---

### 🟡 中优先级

#### 2. `getCategoryEmoji` 三个页面重复定义

**文件**: `pages/index/index.vue`、`pages/list/list.vue`、`pages/add/add.vue`  
**问题**: 三处硬编码完全相同的 emoji 映射表，且用户自定义分类无法匹配 emoji。

**建议**: 抽取为公共工具函数 `utils/category.js`，并从数据库 `categories` 集合动态获取 icon 字段。

---

#### 3. `initDefaultCategories` 串行插入效率低

**文件**: `pages/add/add.vue`  
**位置**: 默认分类初始化  
**问题**: 用 `for...of + await` 逐条插入 10 个分类，每个都是一次网络请求。

**建议**: 改为并行：
```js
await Promise.all(defaults.map(cat =>
  uniCloud.callFunction({ name: 'add-category', data: cat }).catch(() => {})
))
```

---

#### 4. 首页跨年翻月边界判断有 Bug

**文件**: `pages/index/index.vue`  
**位置**: `nextMonth` 方法  
**问题**: 分别比较年+月来判断是否超过当前月，跨年场景会出错（如 2024年12月 翻到 2025年1月 被错误拦截）。

**建议**: 使用时间戳比较：
```js
const target = new Date(this.currentYear, this.currentMonth)
const now = new Date()
if (target.getTime() >= new Date(now.getFullYear(), now.getMonth()).getTime()) {
  return
}
```

---

#### 5. `formatMoney` 在多个页面重复

**文件**: `pages/index/index.vue`、`pages/list/list.vue`  
**建议**: 抽取到公共 mixin 或 utils。

---

### 🟢 低优先级

#### 6. `loadCategories` 失败时可能重复写入默认数据

**文件**: `pages/add/add.vue`  
**问题**: 网络异常导致 `get-categories` 失败时，直接调用 `initDefaultCategories`，可能造成重复插入。

**建议**: 增加初始化标记，或由云函数 `add-category` 内部处理重复。

---

#### 7. `onLoad` 和 `onShow` 重复调用 `initMonth`

**文件**: `pages/index/index.vue`  
**建议**: 移除 `onLoad` 中的 `initMonth()`，仅保留 `onShow`。

---

#### 8. 空 catch 块吞没错误

**文件**: `pages/add/add.vue` L180  
**问题**: `try { ... } catch (e) {}` 完全忽略异常，无日志输出。

**建议**: 至少打印 `console.error(e)`。

---

## 三、优点总结

1. **云函数设计合理**：6 个云函数职责单一，输入校验完整，错误码语义清晰
2. **数据库设计规范**：Schema 定义完整，字段类型明确，索引合理
3. **UI 体验优秀**：Soft Candy 风格统一，动画流畅，空状态/加载态处理到位
4. **分页实现正确**：`get-bills` 支持 skip/limit 分页，`loadMore` 有重复加载保护
5. **金额校验严格**：多处金额验证（>0、最大999999999.99、最多2位小数）

----

## 四、改进优先级建议

| 序号 | 改进项 | 预计工作量 |
|:--:|------|:--:|
| 1 | finally 块替换 saving 重置 | 2 分钟 |
| 2 | 分类初始化改为并行 Promise.all | 1 分钟 |
| 3 | 跨年翻月 Bug 修复 | 3 分钟 |
| 4 | 抽取公共 emoji 映射 | 10 分钟 |
| 5 | 抽取公共 formatMoney | 5 分钟 |

---

*审查完毕，以上问题均不影响核心功能正常运行。建议优先修复序号 1-3。*
