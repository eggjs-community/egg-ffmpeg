'use strict';

module.exports = appInfo => {
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_znffmpeg';

  // add your config here
  config.middleware = ['robot','errorHandler','apiWrapper'];
  config.errorHandler = {match: '/api'};
  config.robot = {ua: [/curl/i, /Baiduspider/i, ]};
  config.security = {
    ignore: '/api/',
    domainWhiteList: ['http://localhost:8000'],
    methodnoallow: {enable: false },
    csrf: {
      enable: false,
      ignoreJSON: true, // 默认为 false，当设置为 true 时，将会放过所有 content-type 为 `application/json` 的请求
    },
  };
  
  config.cors = {
    allowMethods: 'GET,HEAD,PUT,OPTIONS,POST,DELETE,PATCH'
  };
  config.dataConfig={
    resources:['vtask'],
    vtaskDb:"web_vtask",
    vtaskId:"id",
  }

  config.mysql = {
    // 单数据库信息配置
    client: {
      // host
      host: '127.0.0.1',
      // 端口号
      port: '3306',
      // 用户名
      user: 'root',
      // 密码
      password: '',
      // 数据库名
      database: 'videotask',
    },
    // 是否加载到 app 上，默认开启
    app: true,
    // 是否加载到 agent 上，默认关闭
    agent: false,
  }

  return config;

};

