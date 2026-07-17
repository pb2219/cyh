'use strict';

/**
 * 云函数：get-statistics
 * 功能：获取指定月份的收支统计（总收入、总支出、结余、分类统计）
 * 请求参数：{ month?: 'YYYY-MM' } 不传则默认当前月
 * 返回：{ code: 0, data: { totalIncome, totalExpense, balance, categoryBreakdown: [...] }, message: 'success' }
 */
exports.main = async (event, context) => {
  const db = uniCloud.database()
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const month = event.month || defaultMonth

  try {
    // 查询当月所有账单
    const res = await db.collection('bills')
      .where({
        date: db.command.gte(month + '-01').and(db.command.lte(month + '-31'))
      })
      .get()

    const bills = res.data
    let totalIncome = 0
    let totalExpense = 0
    const categoryMap = {}

    bills.forEach(bill => {
      const amount = Number(bill.amount) || 0
      if (bill.type === 'income') {
        totalIncome += amount
      } else {
        totalExpense += amount
      }

      // 分类统计
      const key = bill.category || '其他'
      if (!categoryMap[key]) {
        categoryMap[key] = { category: key, income: 0, expense: 0 }
      }
      if (bill.type === 'income') {
        categoryMap[key].income += amount
      } else {
        categoryMap[key].expense += amount
      }
    })

    const categoryBreakdown = Object.values(categoryMap).sort((a, b) => {
      return (b.income + b.expense) - (a.income + a.expense)
    })

    return {
      code: 0,
      data: {
        month,
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalExpense: Math.round(totalExpense * 100) / 100,
        balance: Math.round((totalIncome - totalExpense) * 100) / 100,
        billCount: bills.length,
        categoryBreakdown
      },
      message: 'success'
    }
  } catch (err) {
    console.error('get-statistics error:', err)
    return { code: 500, message: '服务器错误：' + err.message }
  }
}
