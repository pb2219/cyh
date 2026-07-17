'use strict';

/**
 * 云函数：add-category
 * 功能：添加一个分类
 * 请求参数：{ name: '分类名', type: 'income'|'expense', icon?: '图标emoji' }
 * 返回：{ code: 0, data: 记录对象, message: 'success' }
 */
exports.main = async (event, context) => {
  const db = uniCloud.database()
  const { name, type, icon = '📌' } = event

  if (!name) {
    return { code: 400, message: '参数错误：name 不能为空' }
  }
  if (!type || !['income', 'expense'].includes(type)) {
    return { code: 400, message: '参数错误：type 必须为 income 或 expense' }
  }

  try {
    // 检查重名
    const existRes = await db.collection('categories')
      .where({ name, type })
      .count()
    if (existRes.total > 0) {
      return { code: 409, message: '该分类已存在' }
    }

    const res = await db.collection('categories').add({
      name,
      type,
      icon,
      sort: 0
    })
    return { code: 0, data: res, message: '添加成功' }
  } catch (err) {
    console.error('add-category error:', err)
    return { code: 500, message: '服务器错误：' + err.message }
  }
}
