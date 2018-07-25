'use strict';

module.exports = app => {
  app.get('/', 'videoProcess.index');
  app.post('/', 'videoProcess.index');
  app.get('/getInfoByFileId', 'videoProcess.getInfoByFileId');
  app.post('/getInfoByUrlList', 'videoProcess.getInfoByUrlList');
  app.post('/vTranscodeAndWater', 'videoProcess.vTranscodeAndWater');
  app.post('/vTranscode', 'videoProcess.vTranscode');
  app.post('/vConcat', 'videoProcess.vConcat');
  app.post('/vClip', 'videoProcess.vClip');
  app.post('/vDownload', 'videoProcess.vDownload');




};
