<template>
	<view class="container">
		<!-- 类型切换 -->
		<view class="type-switch">
			<view class="switch-btn" :class="{ active: formData.type === 'expense' }" @tap="switchType('expense')">
				支出
			</view>
			<view class="switch-btn" :class="{ active: formData.type === 'income' }" @tap="switchType('income')">
				收入
			</view>
		</view>

		<!-- 金额输入 -->
		<view class="amount-section">
			<text class="currency">¥</text>
			<input class="amount-input" type="digit" v-model="amountStr" placeholder="0.00" focus
				:adjust-position="true" />
		</view>

		<!-- 分类选择 -->
		<view class="form-group">
			<text class="form-label">分类</text>
			<scroll-view scroll-x class="category-scroll">
				<view v-for="cat in currentCategories" :key="cat._id" class="category-tag"
					:class="{ selected: formData.category === cat.name }" @tap="selectCategory(cat)">
					<text class="cat-icon">{{ cat.icon }}</text>
					<text class="cat-name">{{ cat.name }}</text>
				</view>
			</scroll-view>
		</view>

		<!-- 日期选择 -->
		<view class="form-group">
			<text class="form-label">日期</text>
			<picker mode="date" :value="formData.date" :end="today" @change="onDateChange">
				<view class="picker-value">{{ formData.date }}</view>
			</picker>
		</view>

		<!-- 备注 -->
		<view class="form-group">
			<text class="form-label">备注</text>
			<input class="remark-input" v-model="formData.remark" placeholder="添加备注（选填）" />
		</view>

		<!-- 保存按钮 -->
		<button class="save-btn" :disabled="!canSave || saving" @tap="saveBill">
			{{ saving ? '保存中...' : '保 存' }}
		</button>
	</view>
</template>

<script>
	export default {
		data() {
			const now = new Date()
			const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
			return {
				formData: {
					type: 'expense',
					amount: 0,
					category: '',
					date: today,
					remark: ''
				},
				amountStr: '',
				today,
				categories: [],
				saving: false
			}
		},
		computed: {
			currentCategories() {
				return this.categories.filter(c => c.type === this.formData.type)
			},
			canSave() {
				return Number(this.amountStr) > 0 && this.formData.category
			}
		},
		onShow() {
			this.loadCategories()
		},
		methods: {
			switchType(type) {
				this.formData.type = type
				this.formData.category = ''
			},
			selectCategory(cat) {
				this.formData.category = cat.name
			},
			onDateChange(e) {
				this.formData.date = e.detail.value
			},
			async loadCategories() {
				try {
					const res = await uniCloud.callFunction({
						name: 'get-categories',
						data: {}
					})
					if (res.result && res.result.code === 0) {
						this.categories = res.result.data
					}
					// 如果没有分类，初始化默认分类
					if (!this.categories || this.categories.length === 0) {
						await this.initDefaultCategories()
					}
				} catch (e) {
					console.error('加载分类失败:', e)
					await this.initDefaultCategories()
				}
			},
			async initDefaultCategories() {
				const defaults = [
					{ name: '餐饮', type: 'expense', icon: '🍜', sort: 1 },
					{ name: '交通', type: 'expense', icon: '🚗', sort: 2 },
					{ name: '购物', type: 'expense', icon: '🛒', sort: 3 },
					{ name: '娱乐', type: 'expense', icon: '🎮', sort: 4 },
					{ name: '住房', type: 'expense', icon: '🏠', sort: 5 },
					{ name: '工资', type: 'income', icon: '💼', sort: 1 },
					{ name: '兼职', type: 'income', icon: '💻', sort: 2 },
					{ name: '投资', type: 'income', icon: '📈', sort: 3 },
					{ name: '红包', type: 'income', icon: '🧧', sort: 4 }
				]
				for (const cat of defaults) {
					try {
						await uniCloud.callFunction({
							name: 'add-category',
							data: cat
						})
					} catch (e) {
						// 忽略已存在的分类
					}
				}
				// 重新加载分类
				const res = await uniCloud.callFunction({
					name: 'get-categories',
					data: {}
				})
				if (res.result && res.result.code === 0) {
					this.categories = res.result.data
				}
			},
			async saveBill() {
				if (!this.canSave) return

				this.saving = true
				try {
					const res = await uniCloud.callFunction({
						name: 'add-bill',
						data: {
							type: this.formData.type,
							amount: Number(this.amountStr),
							category: this.formData.category,
							date: this.formData.date,
							remark: this.formData.remark
						}
					})

					if (res.result && res.result.code === 0) {
						uni.showToast({ title: '保存成功', icon: 'success' })
						this.resetForm()
					} else {
						uni.showToast({
							title: res.result?.message || '保存失败',
							icon: 'none'
						})
					}
				} catch (e) {
					console.error('保存失败:', e)
					uni.showToast({ title: '网络错误，请重试', icon: 'none' })
				}
				this.saving = false
			},
			resetForm() {
				this.amountStr = ''
				this.formData.category = ''
				this.formData.remark = ''
			}
		}
	}
</script>

<style scoped>
	.container {
		padding: 30rpx;
	}

	.type-switch {
		display: flex;
		background: #f0f0f0;
		border-radius: 40rpx;
		padding: 6rpx;
		margin-bottom: 40rpx;
	}

	.switch-btn {
		flex: 1;
		text-align: center;
		padding: 16rpx 0;
		border-radius: 36rpx;
		font-size: 28rpx;
		color: #666;
		transition: all 0.3s;
	}

	.switch-btn.active {
		background: #fff;
		color: #FF4D4F;
		font-weight: bold;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
	}

	.switch-btn:last-child.active {
		color: #52C41A;
	}

	.amount-section {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 40rpx 0;
		border-bottom: 2rpx solid #f0f0f0;
		margin-bottom: 30rpx;
	}

	.currency {
		font-size: 56rpx;
		color: #333;
		font-weight: bold;
		margin-right: 10rpx;
	}

	.amount-input {
		font-size: 72rpx;
		font-weight: bold;
		color: #333;
		width: 400rpx;
		text-align: left;
	}

	.form-group {
		margin-bottom: 30rpx;
	}

	.form-label {
		font-size: 26rpx;
		color: #999;
		margin-bottom: 16rpx;
		display: block;
	}

	.category-scroll {
		white-space: nowrap;
		padding: 10rpx 0;
	}

	.category-tag {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		padding: 16rpx 24rpx;
		margin-right: 20rpx;
		border-radius: 16rpx;
		background: #f8f8f8;
		transition: all 0.3s;
	}

	.category-tag.selected {
		background: #E6F4FF;
		border: 2rpx solid #1677FF;
	}

	.cat-icon {
		font-size: 36rpx;
		margin-bottom: 6rpx;
	}

	.cat-name {
		font-size: 22rpx;
		color: #666;
	}

	.category-tag.selected .cat-name {
		color: #1677FF;
	}

	.picker-value {
		font-size: 30rpx;
		color: #333;
		padding: 16rpx 0;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.remark-input {
		font-size: 30rpx;
		color: #333;
		padding: 16rpx 0;
		border-bottom: 1rpx solid #f0f0f0;
		width: 100%;
	}

	.save-btn {
		margin-top: 60rpx;
		background: #1677FF;
		color: #fff;
		border-radius: 40rpx;
		font-size: 32rpx;
		font-weight: bold;
		padding: 24rpx 0;
	}

	.save-btn[disabled] {
		background: #ccc;
	}
</style>
