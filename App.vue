<script>
	export default {
		onLaunch: function() {
			console.log('记账助手 App Launch')
			// 检查 uniCloud 是否可用
			// #ifdef H5
			console.log('运行环境：H5')
			// #endif
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
	/* 全局公共样式 */
	page {
		background-color: #F5F5F5;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
	}

	/* 按钮重置 */
	button {
		margin: 0;
		padding: 0;
		border: none;
		background: none;
		line-height: inherit;
		font-size: inherit;
	}

	button::after {
		border: none;
	}

	/* 输入框重置 */
	input {
		outline: none;
	}

	/* 统一安全区 */
	.safe-area-bottom {
		padding-bottom: constant(safe-area-inset-bottom);
		padding-bottom: env(safe-area-inset-bottom);
	}
</style>
