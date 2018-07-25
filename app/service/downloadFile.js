const co = require('co');
const Downloader = require('../lib/download');
module.exports = app => {
  class DownloadFile extends app.Service {
    // vFilePath 链接地址,savePath 保存目录
    * vDownload(vFilePath,savePath,taskId,vtaskId) {
      console.log('DownloadFile.vDownload');
      // let data = yield new Promise((resolve, reject)=> {
        let outputFile = savePath + this.ctx.helper.MD5(vtaskId+vFilePath+Date.parse(new Date()))+'.mp4';
        let dl = new Downloader.Download(vFilePath,outputFile);
        dl.on('progress', (progress)=>{
          console.log("" + progress + "%");
        });

        dl.on('end', (code)=>{
          co(this.vDownloadCallback(taskId,vtaskId,code,outputFile));
          // resolve(code);
        });

        dl.start();
      // });
      return vtaskId + " start";// + data;
    }

    * vDownloadCallback(taskId,vtaskId,code,outputFile){
      let isDownload = 0;
      if (code === 0) {
        console.log("finished successfully");
        isDownload=1;
      } else {
        console.log("finished unsuccessfully");
        return;
      }
      //结果写入数据库
      let re = yield this.ctx.service.restql.update('vtask',vtaskId,{isDownload,outputFile:this.ctx.helper.projectPrefix+outputFile});

      const result = yield this.ctx.service.restql.index('vtask',{},{"taskId":taskId});
      let tempValidate = true;
        console.log(result);
      let records = result.record||[];
      for (var i = 0; i < records.length; i++) {
        console.log(records[i].isDownload);
        if (!records[i].isDownload) {
          tempValidate=false;
        }
        // tempValidate = result[i].isDownload?true:false;
      }
      //当所有的任务都完成的时候，才发送请求
      if (tempValidate) {
        // let client = new HttpClient();
        // client.post(url,{taskId,disType});
        const result = yield this.ctx.curl('http://127.0.0.1:7001', {
          // 必须指定 method
          method: 'POST',
          // 通过 contentType 告诉 HttpClient 以 JSON 格式发送
          contentType: 'json',
          data: {
            hello: 'world',
            now: Date.now(),
          },
          // 明确告诉 HttpClient 以 JSON 格式处理返回的响应 body
          dataType: 'json',
        });
        console.log(result.data);
      }
    }

  }
  return DownloadFile;
};