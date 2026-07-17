<template>
	<view class="container">
		<!-- 顶部装饰 -->
		<view class="top-deco">
			<text class="deco-emoji">🌸</text>
			<text class="deco-emoji">✨</text>
			<text class="deco-emoji">🪴</text>
		</view>

		<!-- 月度概览卡片 -->
		<view class="summary-card">
			<view class="card-sparkle">💖</view>
			<view class="month-selector">
				<view class="arrow-btn" @tap="prevMonth">
					<text class="arrow-icon">‹</text>
				</view>
				<view class="month-center">
					<text class="month-emoji">📅</text>
					<text class="month-text">{{ currentMonth }}</text>
				</view>
				<view class="arrow-btn" @tap="nextMonth">
					<text class="arrow-icon">›</text>
				</view>
			</view>
			<view class="summary-row">
				<view class="summary-item">
					<view class="summary-icon income-bg">💰</view>
					<text class="summary-label">收入</text>
					<text class="summary-amount income-text">¥{{ formatMoney(stats.totalIncome) }}</text>
				</view>
				<view class="summary-divider"></view>
				<view class="summary-item">
					<view class="summary-icon expense-bg">💸</view>
					<text class="summary-label">支出</text>
					<text class="summary-amount expense-text">¥{{ formatMoney(stats.totalExpense) }}</text>
				</view>
				<view class="summary-divider"></view>
				<view class="summary-item">
					<view class="summary-icon balance-bg">🐷</view>
					<text class="summary-label">结余</text>
					<text class="summary-amount" :class="stats.balance >= 0 ? 'income-text' : 'expense-text'">
						¥{{ formatMoney(stats.balance) }}
					</text>
				</view>
			</view>
		</view>

		<!-- 分类统计 -->
		<view class="section">
			<view class="section-header">
				<view class="section-title-row">
					<text class="title-emoji">🏆</text>
					<text class="section-title">分类排行</text>
				</view>
			</view>
			<view v-if="stats.categoryBreakdown && stats.categoryBreakdown.length > 0" class="category-list">
				<view v-for="(item, index) in stats.categoryBreakdown" :key="index" class="category-item">
					<view class="category-left">
						<view class="rank-badge" :class="'rank-' + (index + 1)">
							<text v-if="index === 0">🥇</text>
							<text v-else-if="index === 1">🥈</text>
							<text v-else-if="index === 2">🥉</text>
							<text v-else class="rank-num">{{ index + 1 }}</text>
						</view>
						<text class="category-name">{{ item.category }}</text>
					</view>
					<view class="category-right">
						<text v-if="item.income > 0" class="cat-income">
							+¥{{ formatMoney(item.income) }}
						</text>
						<text v-if="item.expense > 0" class="cat-expense">
							-¥{{ formatMoney(item.expense) }}
						</text>
					</view>
				</view>
			</view>
			<view v-else class="empty-hint">
				<text class="empty-emoji">📝</text>
				<text>本月暂无账单哦~</text>
			</view>
		</view>

		<!-- 最近账单 -->
		<view class="section">
			<view class="section-header">
				<view class="section-title-row">
					<text class="title-emoji">🕐</text>
					<text class="section-title">最近账单</text>
				</view>
				<text class="section-more" @tap="goToList">查看全部 ›</text>
			</view>
			<view v-if="recentBills.length > 0" class="bill-list">
				<view v-for="(bill, idx) in recentBills" :key="bill._id" class="bill-item" @tap="goToList">
					<view class="bill-icon-col">
						<view class="bill-icon-circle" :class="bill.type === 'income' ? 'icon-income' : 'icon-expense'">
							<text>{{ getCategoryEmoji(bill.category) }}</text>
						</view>
					</view>
					<view class="bill-info-col">
						<text class="bill-category">{{ bill.category }}</text>
						<view class="bill-meta">
							<text class="bill-date">{{ bill.date }}</text>
							<text v-if="bill.remark" class="bill-remark-dot">·</text>
							<text v-if="bill.remark" class="bill-remark">{{ bill.remark }}</text>
						</view>
					</view>
					<text class="bill-amount" :class="bill.type === 'income' ? 'income-text' : 'expense-text'">
						{{ bill.type === 'income' ? '+' : '-' }}¥{{ formatMoney(bill.amount) }}
					</text>
				</view>
			</view>
			<view v-else class="empty-hint">
				<text class="empty-emoji">🪄</text>
				<text>去记一笔，让钱包鼓起来吧~</text>
			</view>
		</view>

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
					return
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
			getCategoryEmoji(category) {
				const map = {
					'餐饮': '🍜', '交通': '🚗', '购物': '🛒', '娱乐': '🎮',
					'住房': '🏠', '工资': '💼', '兼职': '💻', '投资': '📈',
					'红包': '🧧', '奖金': '💰', '其他': '📌'
				}
				return map[category] || '📌'
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
		padding: 0 30rpx 40rpx;
	}

	/* 顶部装饰 */
	.top-deco {
		display: flex;
		justify-content: center;
		gap: 40rpx;
		padding: 16rpx 0 8rpx;
	}

	.deco-emoji {
		font-size: 36rpx;
		animation: float 3s ease-in-out infinite;
	}

	.deco-emoji:nth-child(2) {
		animation-delay: 0.5s;
	}

	.deco-emoji:nth-child(3) {
		animation-delay: 1s;
	}

	@keyframes float {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-12rpx);
		}
	}

	/* 概览卡片 */
	.summary-card {
		position: relative;
		background: linear-gradient(145deg, #FF6B9D 0%, #C44DFF 100%);
		border-radius: 48rpx;
		padding: 36rpx 28rpx 32rpx;
		margin-bottom: 28rpx;
		box-shadow: 0 16rpx 40rpx rgba(196, 77, 255, 0.25);
		overflow: hidden;
	}

	.card-sparkle {
		position: absolute;
		top: 12rpx;
		right: 20rpx;
		font-size: 48rpx;
		opacity: 0.6;
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			transform: scale(1);
			opacity: 0.6;
		}
		50% {
			transform: scale(1.15);
			opacity: 1;
		}
	}

	.month-selector {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-bottom: 28rpx;
		gap: 32rpx;
	}

	.arrow-btn {
		width: 56rpx;
		height: 56rpx;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		backdrop-filter: blur(10rpx);
		transition: all 0.2s;
	}

	.arrow-btn:active {
		background: rgba(255, 255, 255, 0.35);
		transform: scale(0.92);
	}

	.arrow-icon {
		color: #fff;
		font-size: 44rpx;
		font-weight: 300;
	}

	.month-center {
		display: flex;
		align-items: center;
		gap: 10rpx;
	}

	.month-emoji {
		font-size: 32rpx;
	}

	.month-text {
		color: #fff;
		font-size: 36rpx;
		font-weight: 700;
		letter-spacing: 2rpx;
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
		gap: 6rpx;
	}

	.summary-icon {
		width: 64rpx;
		height: 64rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 30rpx;
		margin-bottom: 4rpx;
	}

	.income-bg {
		background: rgba(181, 235, 165, 0.4);
	}
	.expense-bg {
		background: rgba(255, 184, 166, 0.4);
	}
	.balance-bg {
		background: rgba(255, 215, 166, 0.4);
	}

	.summary-label {
		color: rgba(255, 255, 255, 0.8);
		font-size: 22rpx;
	}

	.summary-amount {
		color: #fff;
		font-size: 30rpx;
		font-weight: 700;
	}

	.income-text {
		color: #B5EBA5 !important;
	}
	.expense-text {
		color: #FFB8A6 !important;
	}

	.summary-divider {
		width: 2rpx;
		height: 80rpx;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 1rpx;
	}

	/* 区域卡片 */
	.section {
		background: #fff;
		border-radius: 32rpx;
		padding: 28rpx;
		margin-bottom: 24rpx;
		box-shadow: 0 4rpx 20rpx rgba(255, 107, 157, 0.06);
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16rpx;
	}

	.section-title-row {
		display: flex;
		align-items: center;
		gap: 10rpx;
	}

	.title-emoji {
		font-size: 32rpx;
	}

	.section-title {
		font-size: 30rpx;
		font-weight: 700;
		color: #4A3640;
	}

	.section-more {
		font-size: 24rpx;
		color: #FF6B9D;
		padding: 6rpx 16rpx;
		background: #FFF0F5;
		border-radius: 20rpx;
	}

	/* 分类排行 */
	.category-list {
		margin-top: 4rpx;
	}

	.category-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 18rpx 0;
		border-bottom: 1rpx solid #FFF0F5;
	}

	.category-item:last-child {
		border-bottom: none;
	}

	.category-left {
		display: flex;
		align-items: center;
		gap: 16rpx;
	}

	.rank-badge {
		width: 48rpx;
		height: 48rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 14rpx;
		font-size: 28rpx;
		background: #FFF5F7;
	}

	.rank-1,
	.rank-2,
	.rank-3 {
		background: transparent;
		font-size: 36rpx;
	}

	.rank-num {
		font-size: 24rpx;
		color: #C4B5C9;
		font-weight: 600;
	}

	.category-name {
		font-size: 28rpx;
		color: #4A3640;
		font-weight: 500;
	}

	.category-right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 2rpx;
	}

	.cat-income {
		font-size: 26rpx;
		color: #7ECB76;
		font-weight: 600;
	}

	.cat-expense {
		font-size: 26rpx;
		color: #FF7B7B;
		font-weight: 600;
	}

	/* 账单列表 */
	.bill-list {
		margin-top: 4rpx;
	}

	.bill-item {
		display: flex;
		align-items: center;
		padding: 20rpx 8rpx;
		border-bottom: 1rpx solid #FFF5F7;
		gap: 16rpx;
		transition: all 0.2s;
	}

	.bill-item:last-child {
		border-bottom: none;
	}

	.bill-item:active {
		background: #FFFBFD;
		border-radius: 20rpx;
	}

	.bill-icon-col {
		flex-shrink: 0;
	}

	.bill-icon-circle {
		width: 64rpx;
		height: 64rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 28rpx;
	}

	.icon-income {
		background: #F0FDF0;
	}

	.icon-expense {
		background: #FFF5F5;
	}

	.bill-info-col {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 4rpx;
	}

	.bill-category {
		font-size: 28rpx;
		color: #4A3640;
		font-weight: 500;
	}

	.bill-meta {
		display: flex;
		align-items: center;
	}

	.bill-date {
		font-size: 22rpx;
		color: #C4B5C9;
	}

	.bill-remark-dot {
		font-size: 22rpx;
		color: #D4C5D9;
		margin: 0 6rpx;
	}

	.bill-remark {
		font-size: 22rpx;
		color: #D4C5D9;
	}

	.bill-amount {
		font-size: 30rpx;
		font-weight: 700;
		flex-shrink: 0;
	}

	/* 空状态 */
	.empty-hint {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10rpx;
		padding: 50rpx 0 30rpx;
		color: #D4C5D9;
		font-size: 26rpx;
	}

	.empty-emoji {
		font-size: 56rpx;
		margin-bottom: 4rpx;
	}
</style>
