'use strict';

module.exports = app => {
  class VideoProcessController extends app.Controller {
    * index() {      
      this.ctx.body = this.ctx.request.body;
    }
    //POST 根据传进来的urlList返回对应的文件信息，文件是否存在，读取文件信息返回
    * getInfoByUrlList() {
      let urlList = this.ctx.request.body.urlList;
      let resultFileInfo = [];
      const response = {success: false, message: '操作失败', }
      for (var i = 0; i < urlList.length; i++) {
        let tempInfo = yield this.service.videoProcess.getInfo(urlList[i]);
        if (tempInfo.streams.length>0) {
          resultFileInfo.push({
            width:tempInfo.streams[0].width,
            height:tempInfo.streams[0].height,
            duration:tempInfo.streams[0].duration,
          });
        }
      }
      if (resultFileInfo.length>0) {
        response.message = '操作成功'
        response.success = true
        response.data = resultFileInfo
      }
      this.ctx.body = response;
    }
    //根据传进来的fileId返回对应的文件信息，文件是否存在，读取文件信息返回
    * getInfoByFileId() {
      let fileId = this.ctx.query.fileId;
      let filePath = this.ctx.query.filePath;
      let inputFile,outputFile;
      if (fileId) {
        let tempRe = yield this.ctx.service.restql.show('vtask',{id:fileId});
        if (tempRe&&tempRe.id) {
          inputFile = tempRe.inputFile;
          outputFile = tempRe.outputFile;
        }
      }else{
        inputFile = filePath;
        outputFile = false;
      }
      const response = {success: false, message: '操作失败', }
      let inputFileInfo,outputFileInfo;
      if (inputFile) {inputFileInfo = yield this.service.videoProcess.getInfo(inputFile);}
      if (outputFile) {outputFileInfo = yield this.service.videoProcess.getInfo(outputFile);}
      if (inputFileInfo||outputFileInfo) {
        response.message = '操作成功'
        response.success = true
        response.data = {inputFile,inputFileInfo,outputFile,outputFileInfo}
      }
      this.ctx.body = response;
    }
    //根据 fileId list，检查文件是否已经下载或者存在，如果存在 建立taskId,在数据库建立视频文件合并任务记录，返回taskId，开启视频合并任务，回调信息写入数据库，是否成功，然后调用回调地址来进行回调
    * vConcat() {
      console.log(this.query);
      console.log(this.ctx.request.body);
      let fileIdList = this.ctx.request.body.fileIdList;
      let timeStemp = Date.parse(new Date());
      let outputFile = this.ctx.helper.MD5(fileIdList[0]+timeStemp+"");
      let outputFileName = this.ctx.helper.processPrefix+outputFile+".mp4";
      let taskId = outputFile+"_"+Date.parse(new Date())/1000;
      // 建立文件记录
      // let result = yield this.service.restql.index('vfile',tempQuery);
      let inputFile = this.ctx.helper.MD5(fileIdList.join(','));
      let processParam = JSON.stringify(this.ctx.request.body);
      let processType = "vConcat";
      let tempQuery = {
        inputFile,
        outputFile:outputFileName,
        url:fileIdList.join(','),
        isDownload:0,
        isProcess:0,
        taskId,
        processParam,
        processType,
      };
      // 建立任务
      let re = yield this.service.restql.create('vtask',tempQuery);
      let vtaskId = re.insertId;

      // 获取fileId列表里的文件路径
      let urlList = [];
      for (var i = 0; i < fileIdList.length; i++) {
        let tempRe = yield this.ctx.service.restql.show('vtask',{id:fileIdList[i]});
        if (tempRe&&tempRe.id) {
          urlList.push(tempRe.outputFile);
        }
      }

      const response = {success: false, message: '操作失败', }
      const result = yield this.service.videoProcess.vConcat(urlList,outputFileName,taskId,vtaskId);
      if (result) {
        response.message = '操作成功'
        response.success = true
        response.data = result
      }
      this.ctx.body = response;
    }
    //根据 fileId，检查文件是否已经下载或者存在，如果存在 建立taskId,在数据库建立视频文件剪辑任务记录，返回taskId，开启视频合并任务，回调信息写入数据库，是否成功，然后调用回调地址来进行回调
    * vClip() {
      console.log(this.ctx.request.body);
      let fileId = this.ctx.request.body.fileId;
      let timeStemp = Date.parse(new Date());
      let outputFile = this.ctx.helper.MD5(fileId+timeStemp+"");
      let outputFileName = this.ctx.helper.processPrefix+outputFile+".mp4";
      let taskId = outputFile+"_"+Date.parse(new Date())/1000;
      // 建立文件记录
      // let result = yield this.service.restql.index('vfile',tempQuery);
      let inputFile = "";
      let processParam = this.ctx.request.body;
      let processType = "vClip";

      let tempRe = yield this.ctx.service.restql.show('vtask',{id:fileId});
      if (tempRe&&tempRe.id) {
        inputFile = tempRe.outputFile;
      }

      let tempQuery = {
        inputFile,
        outputFile:outputFileName,
        url:fileId,
        isDownload:0,
        isProcess:0,
        taskId,
        processParam:JSON.stringify(processParam),
        processType,
      };
      // 建立任务
      let re = yield this.service.restql.create('vtask',tempQuery);
      let vtaskId = re.insertId;
      const response = {success: false, message: '操作失败', }
      const result = yield this.service.videoProcess.vClip(inputFile,processParam.startTime,processParam.endTime,processParam.duration,outputFileName,taskId,vtaskId);
      if (result) {
        response.message = '操作成功'
        response.success = true
        response.data = result
      }
      this.ctx.body = response;
    }
    //根据post的 url list 信息, 建立taskId,在数据库建立视频文件下载任务记录，返回taskId，开启视频下载任务，回调信息写入数据库，是否成功，然后调用回调地址来进行回调
    * vDownload() {
      console.log(this.ctx.request.body);
      let urlList = this.ctx.request.body.urlList;
      let timeStemp = Date.parse(new Date());
      let outputFile = this.ctx.helper.MD5(urlList[0]+timeStemp);//没使用
      let taskId = outputFile+"_"+Date.parse(new Date())/1000;
      let vtaskIds = [];
      // 建立任务记录，生成taskId
      for (let i = 0; i < urlList.length; i++) {
        // 建立文件记录
        // let result = yield this.service.restql.index('vfile',tempQuery);
        let inputFile = this.ctx.helper.MD5(urlList[i]);
        let processParam = "vDownload";
        let processType = "vDownload";
        let tempQuery = {
          inputFile,
          outputFile,
          url:urlList[i],
          isDownload:0,
          isProcess:0,
          taskId,
          processParam,
          processType,
        };
        // 建立任务
        let re = yield this.service.restql.create('vtask',tempQuery);
        vtaskIds.push(re.insertId);
      }

      // 开启下载任务
      const response = {success: false, message: '操作失败', }
      
      const result = yield  this.service.videoProcess.vDownload(urlList,"app/public/downloads/",taskId,vtaskIds);
      if (result) {
        response.message = '操作成功'
        response.success = true
        response.data = result
      }
      this.ctx.body = response;
    }
    //根据 fileId，视频转码加入水印任务，回调信息写入数据库，是否成功，然后调用回调地址来进行回调
    * vTranscodeAndWater() {
      console.log(this.ctx.request.body);
      let fileId = this.ctx.request.body.fileId;
      let fileURL = this.ctx.request.body.fileURL;
      let markStr = this.ctx.request.body.markStr;
      let timeStemp = Date.parse(new Date());
      let outputFile = this.ctx.helper.MD5(fileId+timeStemp+"");
      let outputFileName = this.ctx.helper.processPrefix+outputFile+".mp4";
      let taskId = outputFile+"_"+Date.parse(new Date())/1000;
      // 建立文件记录
      let inputFile = fileURL;
      let processParam = this.ctx.request.body;
      let processType = "vTranscodeAndWater";

      let tempQuery = {
        inputFile,
        outputFile:outputFileName,
        url:fileId,
        isDownload:0,
        isProcess:0,
        taskId,
        processParam:JSON.stringify(processParam),
        processType,
      };
      // 建立任务
      let re = yield this.service.restql.create('vtask',tempQuery);
      let vtaskId = re.insertId;
      const response = {success: false, message: '操作失败', }
      const result = yield this.service.videoProcess.vTranscodeAndWater(inputFile,outputFileName,taskId,vtaskId,markStr);
      if (result) {
        response.message = '操作成功';
        response.success = true;
        response.data = result;
      }
      this.ctx.body = response;
    }
    //根据 fileId，视频转码加入水印任务，回调信息写入数据库，是否成功，然后调用回调地址来进行回调
    * vTranscode() {
      console.log(this.ctx.request.body);
      let fileId = this.ctx.request.body.fileId;
      let fileURL = this.ctx.request.body.fileURL;
      let timeStemp = Date.parse(new Date());
      let outputFile = this.ctx.helper.MD5(fileId+timeStemp+"");
      let outputFileName = this.ctx.helper.processPrefix+outputFile+".mp4";
      let taskId = outputFile+"_"+Date.parse(new Date())/1000;
      // 建立文件记录
      let inputFile = fileURL;
      let processParam = this.ctx.request.body;
      let processType = "vTranscode";

      let tempQuery = {
        inputFile,
        outputFile:outputFileName,
        url:fileId,
        isDownload:0,
        isProcess:0,
        taskId,
        processParam:JSON.stringify(processParam),
        processType,
      };
      // 建立任务
      let re = yield this.service.restql.create('vtask',tempQuery);
      let vtaskId = re.insertId;
      const response = {success: false, message: '操作失败', }
      const result = yield this.service.videoProcess.vTranscode(inputFile,outputFileName,taskId,vtaskId);
      if (result) {
        response.message = '操作成功';
        response.success = true;
        response.data = result;
      }
      this.ctx.body = response;
    }
  }
  return VideoProcessController;
};
