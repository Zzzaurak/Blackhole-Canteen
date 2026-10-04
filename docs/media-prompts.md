# 首版腾讯云视频（2026-10-05）

用户本轮明确授权生成并插入视频，采用课程 [TokenHub 说明](../../scala-course-homework/SKILL.md)。先发一次短文本联通请求，视频任务只提交一次，没有重新生成。

- 模型：`hy-video-v1.5`，图生视频，5 秒、720p、无声。实际文件时长约 5.04 秒，24fps。
- 输入：`media/departure-first-frame.png`，由当前真实前端隐藏界面文字后截图，保留小吞和局部星海。使用官方支持的 Base64 输入，不上传凭据或本地路径。
- 完整提示词：`media/departure-prompt.txt`。目标是从局部俯视倾斜下降、推进至恒星旁；所有食堂先共用一段镜头，尚未逐个匹配恒星类型。
- 原始输出：`media/departure-original.mp4`。原片底部产生无意义字符，保留原片供复核，在本地裁切掉底部区域并转为 1280×720 的 H.264 faststart 文件。小吞与星体仍有模型风格化变化，属于首版效果。
- 网页素材：`../public/assets/departure-v1.mp4`（相对项目根目录为 `public/assets/departure-v1.mp4`）、`return-v1.mp4`、`arrival-v1.jpg`。返回片段由正向片段本地倒放，不另行生成、不追加模型费用。
- 实际任务 ID、状态、返回用量：`media/video-task.json`。只记录无密钥元数据，不保存临时签名 URL。

## 本次费用

腾讯云返回 `tokenhub_usage.total_tokens = 150000`。按[官方价格表](https://cloud.tencent.cn/document/product/1823/130055) 10 元 / 百万 token 折算，**视频费用约 1.50 元**，即 5 秒 × 0.3 元 / 秒。课程额度扣减和最终结算以账号账单为准；这不是已查询的现金扣款。另有一次短文本联通调用，不包含在这 15 万视频 token 中。

## 播放与复现

`src/JourneyVideo.tsx` 播放生成文件。推荐算法先抽样、先保存；视频不影响选择结果。视频正常结束后显示末帧与推荐卡片，收起结果播放返回片段。用户可跳过，加载错误 / 自动播放受阻 / 超过 12 秒未完成时自动显示结果；暂停和减少动态效果模式不播放。页面本身从不读取 API key，也不发生成请求。

`python3 scripts/tokenhub_video.py poll --config <本机课程配置路径>` 可查询同一任务；已有任务回执时 `submit` 拒绝重复提交。`bash scripts/prepare-video.sh` 可重建裁切版、倒放视频、末帧和接触表，不消耗云额度。

当前遵循用户指定的腾讯云方案，待机背景仍是 Canvas；这不是原作业流程里即梦生成的首尾循环背景。旧图像制作与未授权生成时期的记录如下，保留为过程档案。

---

# 早期图像制作与转场规划（历史记录）

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
