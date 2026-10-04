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

## 即梦 / Seedance 5 秒循环视频提示词草案

以下仅为准备好的提示词，本次没有提交生成。

```text
使用提供的小黑洞 IP 与棒旋星系图片作为视觉参考。16:9，5 秒，固定镜头，无镜头推拉或平移，无文字、水印、音效或突然闪烁。精致可爱、深靛蓝宇宙、紫色星尘和温暖金色辉光。

为可交互网页制作环境背景：保留清楚的中央棒状结构和两条旋臂，移除前景小黑洞（网页会另行叠加同一个角色）；不要加入明显的大型前景恒星，以免与网页交互恒星重复。画面边缘保持深色留白。

0—1 秒：星尘开始轻微闪烁，中心辉光从基准值缓慢增加。
1—2 秒：稀疏光点微微漂移，旋臂保持固定形态，光晕继续轻微增强。
2—3 秒：2.5 秒达到最亮，但不曝光；星尘沿原路径开始回返。
3—4 秒：亮度和星尘位置平滑回到初始值，动作节奏对称。
4—5 秒：全部回归第一帧位置、形态、颜色与亮度。首尾帧相同，运动速度也应连续，循环时没有停顿或跳变。

禁止在五秒内让整个星系旋转一整圈。只使用轻微的周期辉光和原位漂浮。
```

文字要求不能保证模型真正输出完全匹配的首尾帧。生成后应实看循环接缝；若工具支持首尾帧约束，则使用同一环境图，必要时做剪辑修正。

## 课程模型资源参考

已阅读 `../../scala-course-homework/SKILL.md` 和 `tokenhub_student_quickstart.txt` 的视频章节。它列出 TokenHub 的混元视频与 Kling 视频异步接口。没有调用，不保证当前账号权限或接口材料仍与在线服务一致。

作业明确写即梦流程，因此优先在即梦生成。若之后确定使用课程 API：在本地脚本读取已有课程 JSON 配置，只提交一次任务，持久保存任务 ID 后轮询；不要把凭据复制进这个前端目录，更不能加入 `VITE_*` 配置。当前没有加入自动生成脚本，启动或构建应用不会消耗模型额度。

## 接入与验证

1. 将视频置于 `public/assets/galaxy-loop.mp4`，推荐 H.264、720p/1080p、无声，约 5 秒。
2. 从 `.env.example` 建立 `.env.local`，视频路径为 `./assets/galaxy-loop.mp4`。
3. 重启开发服务或重新构建，检查首页实际使用 video，而非 Canvas 回退。
4. 检查静音自动播放、循环接缝、暂停/恢复、手机行内播放、加载失败静态/Canvas 回退。
5. 背景只有一个环境层。可移动小吞和食堂恒星保留前端控制，避免角色分身。

## 27 秒演示脚本

| 秒数  | 操作                                   |
| ----- | -------------------------------------- |
| 0—4   | 首页循环背景与小吞                     |
| 4—9   | 选出发地、时间、心情                   |
| 9—15  | 抽取、靠近恒星、展示推荐卡             |
| 15—22 | 记录实际食堂、时间和评分，播放吞星反馈 |
| 22—27 | 日志页查看记录，刷新后再次显示         |

初稿演示如果录制，只能展示当前 Canvas 背景；接入真正视频后需要重录最终作业版本。完整提交需低于 100MB，录屏不超过 30 秒。
