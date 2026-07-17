'use strict';

/**
 * 云函数：add-bill
 * 功能：添加一条账单记录
 * 请求参数：{ type: 'income'|'expense', amount: 数字, category: '分类名', date: 'YYYY-MM-DD', remark?: '备注' }
 * 返回：{ code: 0, data: 记录对象, message: 'success' }
 */
exports.main = async (event, context) => {
  const db = uniCloud.database()
  const { type, amount, category, date, remark = '' } = event

  // 参数校验
  if (!type || !['income', 'expense'].includes(type)) {
    return { code: 400, message: '参数错误：type 必须为 income 或 expense' }
  }
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    return { code: 400, message: '参数错误：amount 必须为大于0的数字' }
  }
  if (!category) {
    return { code: 400, message: '参数错误：category 不能为空' }
  }
  if (!date) {
    return { code: 400, message: '参数错误：date 不能为空' }
  }

  try {
    const res = await db.collection('bills').add({
      type,
      amount: Number(amount),
      category,
      date,
      remark,
      createTime: Date.now()
    })
    return { code: 0, data: res, message: '添加成功' }
  } catch (err) {
    console.error('add-bill error:', err)
    return { code: 500, message: '服务器错误：' + err.message }
  }
}
