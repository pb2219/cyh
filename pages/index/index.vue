<template>
	<view class="container">
		<!-- 月度概览卡片 -->
		<view class="summary-card">
			<view class="month-selector">
				<text class="arrow" @tap="prevMonth">‹</text>
				<text class="month-text">{{ currentMonth }}</text>
				<text class="arrow" @tap="nextMonth">›</text>
			</view>
			<view class="summary-row">
				<view class="summary-item">
					<text class="label">收入</text>
					<text class="amount income">¥{{ formatMoney(stats.totalIncome) }}</text>
				</view>
				<view class="divider"></view>
				<view class="summary-item">
					<text class="label">支出</text>
					<text class="amount expense">¥{{ formatMoney(stats.totalExpense) }}</text>
				</view>
				<view class="divider"></view>
				<view class="summary-item">
					<text class="label">结余</text>
					<text class="amount" :class="stats.balance >= 0 ? 'income' : 'expense'">
						¥{{ formatMoney(stats.balance) }}
					</text>
				</view>
			</view>
		</view>

		<!-- 分类统计 -->
		<view class="section">
			<text class="section-title">分类排行</text>
			<view v-if="stats.categoryBreakdown && stats.categoryBreakdown.length > 0" class="category-list">
				<view v-for="(item, index) in stats.categoryBreakdown" :key="index" class="category-item">
					<view class="category-left">
						<text class="rank">{{ index + 1 }}</text>
						<text class="category-name">{{ item.category }}</text>
					</view>
					<view class="category-right">
						<text v-if="item.income > 0" class="cat-income">+¥{{ formatMoney(item.income) }}</text>
						<text v-if="item.expense > 0" class="cat-expense">-¥{{ formatMoney(item.expense) }}</text>
					</view>
				</view>
			</view>
			<view v-else class="empty-hint">
				<text>本月暂无账单记录</text>
			</view>
		</view>

		<!-- 最近账单 -->
		<view class="section">
			<view class="section-header">
				<text class="section-title">最近账单</text>
				<text class="section-more" @tap="goToList">查看全部 ›</text>
			</view>
			<view v-if="recentBills.length > 0" class="bill-list">
				<view v-for="bill in recentBills" :key="bill._id" class="bill-item" @tap="goToList">
					<view class="bill-left">
						<text class="bill-category">{{ bill.category }}</text>
						<text class="bill-date">{{ bill.date }}</text>
						<text v-if="bill.remark" class="bill-remark">{{ bill.remark }}</text>
					</view>
					<text class="bill-amount" :class="bill.type === 'income' ? 'income' : 'expense'">
						{{ bill.type === 'income' ? '+' : '-' }}¥{{ formatMoney(bill.amount) }}
					</text>
				</view>
			</view>
			<view v-else class="empty-hint">
				<text>点击下方"记账"开始记录吧</text>
			</view>
		</view>

		<!-- 加载提示 -->
		<uni-load-more v-if="loading" status="loading"></uni-load-more>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				currentMonth: '',
				currentDate: new Date(),
				stats: {
					totalIncome: 0,
					totalExpense: 0,
					balance: 0,
					categoryBreakdown: []
				},
				recentBills: [],
				loading: false
			}
		},
		onLoad() {
			this.initMonth()
		},
		onShow() {
			this.initMonth()
			this.loadData()
		},
		methods: {
			initMonth() {
				const y = this.currentDate.getFullYear()
				const m = String(this.currentDate.getMonth() + 1).padStart(2, '0')
				this.currentMonth = `${y}-${m}`
			},
			prevMonth() {
				this.currentDate.setMonth(this.currentDate.getMonth() - 1)
				this.initMonth()
				this.loadData()
			},
			nextMonth() {
				const now = new Date()
				if (this.currentDate.getFullYear() === now.getFullYear() &&
					this.currentDate.getMonth() >= now.getMonth()) {
					return // 不能超过当前月
				}
				this.currentDate.setMonth(this.currentDate.getMonth() + 1)
				this.initMonth()
				this.loadData()
			},
			async loadData() {
				this.loading = true
				try {
					await Promise.all([this.getStatistics(), this.getRecentBills()])
				} catch (e) {
					console.error('加载数据失败:', e)
					uni.showToast({ title: '加载失败，请重试', icon: 'none' })
				}
				this.loading = false
			},
			async getStatistics() {
				try {
					const res = await uniCloud.callFunction({
						name: 'get-statistics',
						data: { month: this.currentMonth }
					})
					if (res.result && res.result.code === 0) {
						this.stats = res.result.data
					}
				} catch (e) {
					console.error('获取统计失败:', e)
				}
			},
			async getRecentBills() {
				try {
					const res = await uniCloud.callFunction({
						name: 'get-bills',
						data: { month: this.currentMonth, page: 1, pageSize: 5 }
					})
					if (res.result && res.result.code === 0) {
						this.recentBills = res.result.data.list
					}
				} catch (e) {
					console.error('获取账单失败:', e)
				}
			},
			formatMoney(val) {
				return Number(val || 0).toFixed(2)
			},
			goToList() {
				uni.switchTab({ url: '/pages/list/list' })
			}
		}
	}
</script>

<style scoped>
	.container {
		padding: 20rpx 30rpx;
		padding-bottom: 30rpx;
	}

	.summary-card {
		background: linear-gradient(135deg, #1677FF, #4096FF);
		border-radius: 20rpx;
		padding: 40rpx 30rpx;
		margin-bottom: 30rpx;
		box-shadow: 0 8rpx 24rpx rgba(22, 119, 255, 0.3);
	}

	.month-selector {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-bottom: 30rpx;
	}

	.arrow {
		color: rgba(255, 255, 255, 0.8);
		font-size: 48rpx;
		padding: 0 40rpx;
	}

	.month-text {
		color: #fff;
		font-size: 36rpx;
		font-weight: bold;
	}

	.summary-row {
		display: flex;
		justify-content: space-around;
		align-items: center;
	}

	.summary-item {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.summary-item .label {
		color: rgba(255, 255, 255, 0.75);
		font-size: 24rpx;
		margin-bottom: 10rpx;
	}

	.summary-item .amount {
		color: #fff;
		font-size: 32rpx;
		font-weight: bold;
	}

	.summary-item .amount.income {
		color: #B7EB8F;
	}

	.summary-item .amount.expense {
		color: #FFD666;
	}

	.divider {
		width: 2rpx;
		height: 60rpx;
		background: rgba(255, 255, 255, 0.3);
	}

	.section {
		background: #fff;
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 30rpx;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
	}

	.section-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}

	.section-more {
		font-size: 26rpx;
		color: #1677FF;
	}

	.category-list {
		margin-top: 10rpx;
	}

	.category-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16rpx 0;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.category-item:last-child {
		border-bottom: none;
	}

	.category-left {
		display: flex;
		align-items: center;
	}

	.rank {
		width: 40rpx;
		height: 40rpx;
		line-height: 40rpx;
		text-align: center;
		background: #f0f0f0;
		border-radius: 50%;
		font-size: 22rpx;
		color: #999;
		margin-right: 16rpx;
	}

	.category-item:first-child .rank {
		background: #1677FF;
		color: #fff;
	}

	.category-name {
		font-size: 28rpx;
		color: #333;
	}

	.category-right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}

	.cat-income {
		font-size: 28rpx;
		color: #52C41A;
	}

	.cat-expense {
		font-size: 28rpx;
		color: #FF4D4F;
	}

	.bill-list {
		margin-top: 10rpx;
	}

	.bill-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 0;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.bill-item:last-child {
		border-bottom: none;
	}

	.bill-left {
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.bill-category {
		font-size: 28rpx;
		color: #333;
		font-weight: 500;
	}

	.bill-date {
		font-size: 22rpx;
		color: #999;
		margin-top: 4rpx;
	}

	.bill-remark {
		font-size: 22rpx;
		color: #bbb;
		margin-top: 2rpx;
	}

	.bill-amount {
		font-size: 30rpx;
		font-weight: bold;
	}

	.bill-amount.income {
		color: #52C41A;
	}

	.bill-amount.expense {
		color: #FF4D4F;
	}

	.empty-hint {
		text-align: center;
		padding: 60rpx 0;
		color: #ccc;
		font-size: 28rpx;
	}
</style>
