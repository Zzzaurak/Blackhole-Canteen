# 素材制作与后续视频

## 本次已完成

使用内置 imagegen 工具，未使用 CLI/API fallback。两次调用：先生成透明背景 IP，再以该图为编辑目标加入星系背景。没有调用视频生成模型，也没有读取课程密钥。

- `public/assets/little-black-hole.png`：小吞原图，透明背景，首页互动角色和日志空状态使用。
- `public/assets/galaxy-keyframe.png`：角色加入棒旋星系后的宽屏图，数据与设置面板可预览，也是未来视频的视觉参考与封面。

### IP 原图实际提示词

```text
Use case: stylized-concept. Asset: transparent PNG mascot for a refined Chinese campus dining app called 今天吞哪颗星. Create a single adorable small black hole, round very dark navy fuzzy-smooth body with two tiny warm-white oval eyes, a small joyful mouth and subtle pink cheeks. A luminous inclined accretion disk wraps around its middle, warm butter yellow on the left fading into lavender on the right, disk partially passes behind body, delicate thin orbital arcs. Sophisticated soft 3D clay / illustrated game character, rich soft lighting, friendly curious personality, not a frightening realistic black hole. Centered isolated character occupying 70% of square canvas, generous transparent margin for glow, no stars or scenery, no text, no watermark, genuinely transparent background.
```

### 修改背景实际提示词

```text
Edit the supplied cute black hole mascot image. Preserve its round navy body, two glowing ivory eyes, smiling mouth, pink cheeks and gold-lavender accretion disk exactly as character identity. Place the whole character at small scale, 18% of frame width, just below center, floating in a beautiful deep midnight-violet barred spiral galaxy. Wide landscape 16:9 composition. The galaxy has a distinct luminous elongated central bar and two graceful dusty curved spiral arms, seen at slight inclination. Tiny stars, softly glowing gold and lavender interstellar dust. Refined dreamy 3D illustration consistent with the mascot, high quality, not a flat vector. Generous dark negative space around edges. This is a fixed-camera first/last frame for a future five-second seamless loop. No text, no interface, no labels, no watermark, no other mascots.
```

## 2026-10-05：新的画面与未来镜头方向

本轮按手绘参考直接修改前端视野，没有调用图像或视频模型。原有两张 imagegen 素材继续保留，小吞原图用于前端角色；带完整星系的旧关键帧仅作设计过程存档，不作为新版漂泊场景。

常驻场景：从上方观察星系内部一小块区域，小吞在镜头中部，四周各种恒星与星尘分层缓慢后退。饭点在旋臂中，有柔和星云、光晕和更密集星尘；非饭点在旋臂之间。这些都由前端实时实现。

后续视频只记录方向，本次不制作：

- 点击“吃什么？”后，当前俯视镜头转到斜平视，同时推近并移动到选中类型的恒星旁。
- 结束帧需要与对应食堂恒星和小吞的位置、大小、光照衔接。
- 返回时沿匹配的镜头轨迹退回俯视漂泊视野。
- 具体首尾帧、不同恒星类型如何匹配以及转场播放层，等视野确认后再制作。

推荐结果仍由算法先确定；视频只负责视觉演出，不决定抽样。当前先用纯前端高亮与靠近提示选中目标。

旧的 `VITE_GALAXY_VIDEO` 全景背景配置已停止使用。不要把旧全景视频直接放在新场景上。未来应通过独立的转场层连接局部俯视和近景；老师要求的“动态视频背景”是否满足，需要在最终整体验收中确认。

## 课程资源和额度

此前已阅读 `../../scala-course-homework/SKILL.md` 与课程视频接口速查。没有调用视频模型，也没有读取凭据。后续仍优先按作业要求使用即梦；如改用课程 API，需要再核对接口与权限，密钥只在本地脚本读取，不进入前端。

## 已有演示

`previews/demo-draft.mp4` 保留 2026-10-04 的第一版界面流程，仅用于历史参考。本轮没有重录视频；最新局部星海见 `local-arm-desktop.png`、`local-interarm-desktop.png`、`local-arm-mobile.png`。正式视频接入后再录制不超过 30 秒的最终流程。
