const co = require('co');
const ffmpeg = require('fluent-ffmpeg');
module.exports = app => {
  class VideoProcessService extends app.Service {
    * index() {
      const queryStr = 'show tables;';
      return result;
    }
    // vFilePath 文件路径
    * getInfo(vFilePath) {
      let data = yield new Promise((resolve, reject)=> {
        // '/Users/linti791/webstorm/koa/egg-ffmpeg/app/public/test-vedio.mp4'
        ffmpeg.ffprobe(vFilePath,function(err, metadata) {
          console.log(require('util').inspect(metadata, false, null));
          if (err) return resolve(0);
          return resolve(metadata);
        });
      });
      return data;
    }
    // vFileList 文件列表,outPath 输出路径
    * vConcat(vFileList,outPath,taskId,vtaskId) {
      // let data = yield new Promise((resolve, reject)=> {
        // 合并视频文件
        let proc = ffmpeg(vFileList[0]);
        for (var i = 1; i < vFileList.length; i++) {
          proc.input(vFileList[i]);
        }
        proc.on('end', ()=>{
          console.log('files have been merged succesfully');
          co(this.vCancatCallback(taskId,"vConcat",vtaskId,1));
          // resolve(1);
        })
        .on('error', (err)=>{
          console.log('an error happened: ' + err.message);
          co(this.vCancatCallback(taskId,"vConcat",vtaskId,0));
          // reject(err);
        })
        .mergeToFile(outPath);
        return taskId + " start"
      // });
      // return data;
    }
    //vFilePath 文件路径,startTimeOffset 开始时间,endTimeOffset 结束时间,videoDuration 视频长度
    * vClip(vFilePath,startTimeOffset,endTimeOffset,videoDuration,outPath,taskId,vtaskId) {
      // let data = yield new Promise((resolve, reject)=> {
        let vDuration;
        if (endTimeOffset>0) {
          vDuration = endTimeOffset - startTimeOffset;
        }else{
          vDuration =  videoDuration + endTimeOffset - startTimeOffset;
        }
        // 剪辑视频文件
        let proc = ffmpeg(vFilePath)
        .seek(startTimeOffset)
        .duration(vDuration)
        .on('end', ()=>{
          console.log('files have been clip succesfully');
          co(this.vClipCallback(taskId,"vClip",vtaskId,1));
        })
        .on('error', (err)=>{
          console.log('an error happened: ' + err.message);
          co(this.vClipCallback(taskId,"vClip",vtaskId,0));
        })
        .save(outPath);
      // });
      return taskId + " start";
      // return data;
    }
    //vFilePath 文件路径,
    * vTranscodeAndWater(vFilePath,outPath,taskId,vtaskId,markStr="") {
      // let data = yield new Promise((resolve, reject)=> {
        let wmImg = this.ctx.helper.watermark;
        let tempOutPath = "";
        if (markStr!="") {
          tempOutPath = this.ctx.helper.processPrefix+this.ctx.helper.MD5(outPath)+".mp4";
        }else{
          tempOutPath = outPath;
        }
        // 转码视频文件
        let proc = new ffmpeg({ source: vFilePath, nolog: false});
        proc.audioCodec('copy')
        .videoCodec('copy')
        .format('mp4')
        .outputOptions(['-absf','aac_adtstoasc'])
        .on('end', ()=>{
          console.log('files have been transcode succesfully');
          if (markStr!="") {
            let waterProc = ffmpeg(tempOutPath)
            .outputOption('-q', '0')
            // .input(wmImg)
            // .complexFilter([{
            //   filter: 'overlay',
            //   options: {x: '(main_w/2)-(overlay_w/2)', y: '(main_h/2)-(overlay_h)/2'}
            // }])
            .videoFilters({
              filter: 'drawtext',
              options: {
                fontfile:'app/public/msyh.ttf',
                text: markStr,
                fontsize: 20,
                fontcolor: 'white',
                x: '(main_w/2-text_w/2)',
                y: 50,
                shadowcolor: 'black',
                shadowx: 2,
                shadowy: 2
              }
            })
            .on('end', ()=>{
              co(this.vClipCallback(taskId,"vTranscodeAndWater",vtaskId,1));
            })
            .on('error', function(err, stdout, stderr) {
               console.log('error: ' + err.message);
               console.log('stdout: ' + stdout);
               console.log('stderr: ' + stderr);
            })
            .save(outPath);
          }else{
            co(this.vClipCallback(taskId,"vTranscodeAndWater",vtaskId,1));
          }
        })
        .on('error', (err)=>{
          console.log('an error happened: ' + err.message);
          co(this.vClipCallback(taskId,"vTranscodeAndWater",vtaskId,0));
        })
        .save(tempOutPath);
      return taskId + " start";
      // });
      // return data;
    }
    //vFilePath 文件路径,
    * vTranscode(vFilePath,outPath,taskId,vtaskId) {
        // 转码视频文件
        let proc = new ffmpeg({ source: vFilePath, nolog: false});
        // proc.audioCodec('copy')
        // .format('mp4')
        // .videoCodec('copy')
        proc.size('368x640').autopad('#35A5FF')
        .format('mp4')
        .videoCodec('libx264')
        .audioCodec('copy')
        .outputOptions(['-absf','aac_adtstoasc'])
        .on('end', ()=>{
          console.log('files have been transcode succesfully');
          co(this.vClipCallback(taskId,"vTranscode",vtaskId,1));
        })
        .on('error', (err)=>{
          console.log('an error happened: ' + err.message);
          co(this.vClipCallback(taskId,"vTranscode",vtaskId,0));
        })
        .save(outPath);
      return taskId + " start";
      // });
      // return data;
    }
    // urlList 链接地址,savePath 保存目录
    * vDownload(urlList,savePath,taskId,vtaskIds) {
        console.log('VideoProcessService.vDownload');
      let data = [];
      for (var i = 0; i < urlList.length; i++) {
        let tempResult = yield this.ctx.service.downloadFile.vDownload(urlList[i],savePath,taskId,vtaskIds[i]);
        data.push(tempResult);
      }
      return data;
    }

    * vCancatCallback(taskId,disType,vtaskId,code){
      console.log("vCancatCallback",taskId,disType);
      let isProcess = 0;
      if (code !== 1) {
        console.log("finished unsuccessfully");
        return ;
      }
      console.log("finished successfully");
      isProcess=1;
      //结果写入数据库
      let re = yield this.ctx.service.restql.update('vtask',vtaskId,{isProcess});

      const result = yield this.ctx.curl('http://127.0.0.1:7001', {
        // 必须指定 method
        method: 'POST',
        // 通过 contentType 告诉 HttpClient 以 JSON 格式发送
        contentType: 'json',
        data: {
          hello: 'vCancatCallback',
          now: Date.now(),
        },
        // 明确告诉 HttpClient 以 JSON 格式处理返回的响应 body
        dataType: 'json',
      });
      console.log(result.data);
    }

    * vClipCallback(taskId,disType,vtaskId,code){
      console.log("vClipCallback",taskId,disType);
      let isProcess = 0;
      if (code !== 1) {
        console.log("finished unsuccessfully");
        return ;
      }
      console.log("finished successfully");
      isProcess=1;
      //结果写入数据库
      let re = yield this.ctx.service.restql.update('vtask',vtaskId,{isProcess});

      const result = yield this.ctx.curl('http://127.0.0.1:7001', {
        // 必须指定 method
        method: 'POST',
        // 通过 contentType 告诉 HttpClient 以 JSON 格式发送
        contentType: 'json',
        data: {
          hello: disType,
          now: Date.now(),
        },
        // 明确告诉 HttpClient 以 JSON 格式处理返回的响应 body
        dataType: 'json',
      });
      console.log(result.data);
    }

  }
  return VideoProcessService;
};