# iOS和H5混合开发
这是一个测试案例，主要测试iOS端利用WkWebview实现H5调用原生方法、传参，原生调用H5方法、传参
因为做的是电商项目，老大说不考虑Android4.2以下,iOS7以下,所以不采用url scheme的方式。
# 实现思路
- 第一步:设计出一个Native与JS交互的全局桥对象
- 第二步:JS如何调用Native
- 第三步:Native如何得知api被调用
- 第四步:分析url-参数和回调的格式
- Native如何调用JS
- H5中api方法的注册以及格式
