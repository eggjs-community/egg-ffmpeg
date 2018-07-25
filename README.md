# egg-ffmpeg

egg-ffmpeg egg开发的视频流服务器实例

## QuickStart

<!-- add docs here for user -->

brew reinstall ffmpeg \
--with-chromaprint \
--with-fdk-aac \
--with-libass \
--with-librsvg \
--with-libsoxr \
--with-libssh \
--with-libbluray \
--with-libbs2b \
--with-libcaca \
--with-libgsm \
--with-libmodplug \
--with-libvidstab \
--with-opencore-amr \
--with-openh264 \
--with-openjpeg \
--with-openssl \
--with-tesseract \
--with-rtmpdump \
--with-rubberband \
--with-sdl2 \
--with-snappy \
--with-tools \
--with-webp \
--with-x265 \
--with-xz \
--with-zeromq \
--with-zimg \
--with-frei0r \
--with-game-music-emu

### Development

```bash
$ npm i
$ npm run dev
$ open http://localhost:7001/
```

### Deploy

```bash
$ npm start
$ npm stop
```

### npm scripts

- Use `npm run lint` to check code style.
- Use `npm test` to run unit test.
- Use `npm run autod` to auto detect dependencies upgrade, see [autod](https://www.npmjs.com/package/autod) for more detail.


[egg]: https://eggjs.org