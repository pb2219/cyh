<template>
	<view class="container">
		<!-- 用户头部 -->
		<view class="header-card">
			<view class="avatar">📒</view>
			<text class="greeting">记账助手</text>
			<text class="subtitle">让每一笔都有迹可循</text>
		</view>

		<!-- 分类管理 -->
		<view class="section">
			<view class="section-header">
				<text class="section-title">分类管理</text>
				<text class="add-btn" @tap="showAddCategory">+ 添加</text>
			</view>

			<!-- 支出分类 -->
			<text class="group-label">支出分类</text>
			<view class="category-grid">
				<view v-for="cat in expenseCategories" :key="cat._id" class="category-cell">
					<text class="cell-icon">{{ cat.icon }}</text>
					<text class="cell-name">{{ cat.name }}</text>
				</view>
				<view v-if="expenseCategories.length === 0" class="empty-hint">
					<text>暂无支出分类</text>
				</view>
			</view>

			<!-- 收入分类 -->
			<text class="group-label">收入分类</text>
			<view class="category-grid">
				<view v-for="cat in incomeCategories" :key="cat._id" class="category-cell">
					<text class="cell-icon">{{ cat.icon }}</text>
					<text class="cell-name">{{ cat.name }}</text>
				</view>
				<view v-if="incomeCategories.length === 0" class="empty-hint">
					<text>暂无收入分类</text>
				</view>
			</view>
		</view>

		<!-- 关于 -->
		<view class="section">
			<text class="section-title">关于</text>
			<view class="about-item">
				<text class="about-label">版本</text>
				<text class="about-value">1.0.0</text>
			</view>
			<view class="about-item">
				<text class="about-label">技术栈</text>
				<text class="about-value">uni-app + uniCloud</text>
			</view>
			<view class="about-item">
				<text class="about-label">数据库</text>
				<text class="about-value">阿里云 MongoDB</text>
			</view>
		</view>

		<!-- 添加分类弹窗 -->
		<view v-if="showDialog" class="dialog-mask" @tap="hideDialog">
			<view class="dialog" @tap.stop>
				<text class="dialog-title">添加分类</text>

				<view class="dialog-type">
					<view class="type-option" :class="{ active: newCategory.type === 'expense' }"
						@tap="newCategory.type = 'expense'">
						支出
					</view>
					<view class="type-option" :class="{ active: newCategory.type === 'income' }"
						@tap="newCategory.type = 'income'">
						收入
					</view>
				</view>

				<input class="dialog-input" v-model="newCategory.name" placeholder="分类名称" />
				<input class="dialog-input" v-model="newCategory.icon" placeholder="图标 emoji（如 🍜）" maxlength="2" />

				<view class="dialog-actions">
					<button class="dialog-btn cancel" @tap="hideDialog">取消</button>
					<button class="dialog-btn confirm" @tap="addCategory" :disabled="!newCategory.name">确定</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				categories: [],
				showDialog: false,
				newCategory: {
					name: '',
					type: 'expense',
					icon: '📌'
				}
			}
		},
		computed: {
			expenseCategories() {
				return this.categories.filter(c => c.type === 'expense')
			},
			incomeCategories() {
				return this.categories.filter(c => c.type === 'income')
			}
		},
		onShow() {
			this.loadCategories()
		},
		methods: {
			async loadCategories() {
				try {
					const res = await uniCloud.callFunction({
						name: 'get-categories',
						data: {}
					})
					if (res.result && res.result.code === 0) {
						this.categories = res.result.data
					}
				} catch (e) {
					console.error('加载分类失败:', e)
				}
			},
			showAddCategory() {
				this.newCategory = { name: '', type: 'expense', icon: '📌' }
				this.showDialog = true
			},
			hideDialog() {
				this.showDialog = false
			},
			async addCategory() {
				if (!this.newCategory.name) return
				try {
					const res = await uniCloud.callFunction({
						name: 'add-category',
						data: {
							name: this.newCategory.name,
							type: this.newCategory.type,
							icon: this.newCategory.icon || '📌'
						}
					})
					if (res.result && res.result.code === 0) {
						uni.showToast({ title: '添加成功', icon: 'success' })
						this.hideDialog()
						this.loadCategories()
					} else {
						uni.showToast({
							title: res.result?.message || '添加失败',
							icon: 'none'
						})
					}
				} catch (e) {
					console.error('添加分类失败:', e)
					uni.showToast({ title: '添加失败', icon: 'none' })
				}
			}
		}
	}
</script>

<style scoped>
	.container {
		padding: 20rpx 30rpx;
		padding-bottom: 30rpx;
	}

	.header-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 50rpx 0;
		background: linear-gradient(135deg, #1677FF, #4096FF);
		border-radius: 20rpx;
		margin-bottom: 30rpx;
	}

	.avatar {
		font-size: 72rpx;
		margin-bottom: 16rpx;
	}

	.greeting {
		font-size: 36rpx;
		color: #fff;
		font-weight: bold;
	}

	.subtitle {
		font-size: 24rpx;
		color: rgba(255, 255, 255, 0.7);
		margin-top: 8rpx;
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

	.add-btn {
		font-size: 26rpx;
		color: #1677FF;
		padding: 8rpx 20rpx;
		background: #E6F4FF;
		border-radius: 20rpx;
	}

	.group-label {
		font-size: 26rpx;
		color: #999;
		margin: 16rpx 0 12rpx;
		display: block;
	}

	.category-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 16rpx;
		margin-bottom: 10rpx;
	}

	.category-cell {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 16rpx 20rpx;
		background: #f8f8f8;
		border-radius: 12rpx;
		min-width: 120rpx;
	}

	.cell-icon {
		font-size: 36rpx;
		margin-bottom: 6rpx;
	}

	.cell-name {
		font-size: 24rpx;
		color: #666;
	}

	.about-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 0;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.about-item:last-child {
		border-bottom: none;
	}

	.about-label {
		font-size: 28rpx;
		color: #666;
	}

	.about-value {
		font-size: 28rpx;
		color: #999;
	}

	.empty-hint {
		width: 100%;
		text-align: center;
		padding: 20rpx;
		color: #ccc;
		font-size: 26rpx;
	}

	/* 弹窗 */
	.dialog-mask {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 999;
	}

	.dialog {
		width: 580rpx;
		background: #fff;
		border-radius: 20rpx;
		padding: 40rpx;
	}

	.dialog-title {
		font-size: 34rpx;
		font-weight: bold;
		color: #333;
		text-align: center;
		display: block;
		margin-bottom: 30rpx;
	}

	.dialog-type {
		display: flex;
		background: #f0f0f0;
		border-radius: 10rpx;
		padding: 6rpx;
		margin-bottom: 24rpx;
	}

	.type-option {
		flex: 1;
		text-align: center;
		padding: 14rpx 0;
		border-radius: 8rpx;
		font-size: 28rpx;
		color: #666;
	}

	.type-option.active {
		background: #1677FF;
		color: #fff;
	}

	.dialog-input {
		border: 1rpx solid #e0e0e0;
		border-radius: 10rpx;
		padding: 16rpx 20rpx;
		font-size: 28rpx;
		margin-bottom: 20rpx;
		width: 100%;
		box-sizing: border-box;
	}

	.dialog-actions {
		display: flex;
		gap: 20rpx;
		margin-top: 30rpx;
	}

	.dialog-btn {
		flex: 1;
		border-radius: 40rpx;
		font-size: 28rpx;
		padding: 20rpx 0;
		text-align: center;
	}

	.cancel {
		background: #f5f5f5;
		color: #666;
	}

	.confirm {
		background: #1677FF;
		color: #fff;
	}

	.confirm[disabled] {
		background: #ccc;
	}
</style>
