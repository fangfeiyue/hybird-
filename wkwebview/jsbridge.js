// 统一处理调用ios/android方法
var jsCallNative = {
  ios: function(jsonData) {
    console.log("platform: ios");
    try {
      return window.webkit.messageHandlers.callNativeHandler.postMessage(
        jsonData
      );
    } catch (error) {
      console.warn("可能不是iOS环境", error.message);
      return false;
    }
  },
  android: function(jsonData) {
    console.log("platform: android");
    console.log(typeof jsonData);
    try {
      return window.JSBridge.callNativeHandler(jsonData);
    } catch (error) {
      console.warn("可能不是android坏境", error.message);
      return false;
    }
  }
};

/* js调用native方法 */

/* JSBridge 实现 */
(function() {
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var JSBridge = window.JSBridge || (window.JSBridge = {}); // 暴露全局变量JSBridge，供双方调用
  var responseCallbacks = {}; // 定义的回调函数集合,在原生调用完对应的方法后,会执行对应的回调函数id
  var uniqueId = 1; // 回调函数uniqueId
  var messageHandlers = []; // h5给原生调用的方法集合

  // window.responseCallbacksWatcher = responseCallbacks; // 调试时使用 浏览器检查注册的回调函数
  // window.messageHandlersWatcher = messageHandlers; // 调试时使用 浏览器检查注册的方法函数

  // 实际暴露给原生调用的对象
  var Inner = {
    /* 注册本地JS方法通过JSBridge给原生调用
  * @param {String} handlerName 方法名
  * @param {Function} handler 对应的方法
  */
    registerHandler: function(handlerName, handler) {
      messageHandlers[handlerName] = handler;
    },

    /* 调用原生开放的方法 */
    callHandler: function(handlerName, data, responseCallback) {
      console.log("js call native");
      // 如果没有 data
      if (arguments.length === 2 && typeof data === "function") {
        responseCallback = data;
        data = null;
      }
      doSend({ handlerName: handlerName, data: data }, responseCallback);
    },

    /*
  * 原生调用H5页面注册的方法,或者调用回调方法
  * messageJSON格式
  * 原生主动调用h5方法 {handlerName:方法名,data:数据,callbackId:回调id}
  * h5调原生后，原生通知h5回调， 回调的JSON格式为:{responseId:回调id,responseData:回调数据}
  */
    handleMessageFromNative: function(messageJSON) {
      setTimeout(doDispatchMessageFromNative);

      // 处理原生过来的方法
      function doDispatchMessageFromNative() {
        var message;
        try {
          if (typeof messageJSON === "string") {
            message = JSON.parse(messageJSON);
          } else {
            message = messageJSON;
          }
        } catch (e) {
          console.error("原生调用H5方法出错,传入参数错误, 期望是JSON格式");
          return;
        }
        // 处理h5调原生后，原生通知h5回调
        var responseCallback;
        if (message.responseId) {
          // 从回调函数对象中，取的对应id的回调函数
          responseCallback = responseCallbacks[message.responseId];
          // 处理回调函数不存在的情况
          if (!responseCallback) {
            console.log(`回调函数${message.responseId}不存在`);
            return;
          }
          alert(responseCallback+'我是回调');
        responseCallback(message.responseData); // 执行本地的回调函数
        delete responseCallbacks[message.responseId]; // 删除回调函数
        } else {
          // TODO：原生调用h5，处理callback回调函数
          // 处理原生主动调用h5方法， （没有回调函数responseId，则代表原生主动执行h5本地注册的的函数）
          var handler = messageHandlers[message.handlerName]; // 从本地注册函数中获取
          // 处理本地注册的函数不存在情况
          if (!handler) {
            console.error(`h5没注册${message.handler}函数， 原生无法调用`);
          } else {
            handler(message.data); // 执行本地函数，函要求传入数据
          }
        }
      }
    }
  };

  // JS调用原生方法前,会先send到这里进行处理
  function doSend(message, responseCallback) {
      console.log('message========>', responseCallback);
    var jsonData;
    if (responseCallback) {
      var timestamp = new Date().getTime();
      var callbackId = `callback_${uniqueId++}_${timestamp}`; // 获取唯一callbackId
      responseCallbacks[callbackId] = responseCallback; // 回调函数添加到集合中
      message.callbackId = callbackId; // 添加回调id到传输的参数中
      jsonData = JSON.stringify(message);
    } else {
      jsonData = JSON.stringify(message);
    }
    console.log('param message=====>', jsonData);
    jsCallNative["ios"](jsonData);
  }

  for (var key in Inner) {
    if (!hasOwnProperty.call(JSBridge, key)) {
      JSBridge[key] = Inner[key];
    }
  }
})();

// jsbridgeInit
(function jsBridgeInit() {
  // setData 客户端加载页面时给h5传数据
  window.JSBridge.registerHandler("setData", function(data) {
    var parsedData;
    if (typeof data === "string") {
      parsedData = JSON.parse(data);
    } else {
      parsedData = data;
    }
  });
})();