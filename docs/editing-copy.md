# 我想自己改网页文字，改哪里？

先运行 `npm run dev`，打开网页，再用编辑器修改并保存以下文件。开发模式会自动更新页面；如果在看 `npm run preview` 的版本，改完需要重新 `npm run build`。

## 1. 最常改的文字：`src/copy.ts`

这是本轮新增的集中配置。只改引号里的内容，保留左侧字段名、冒号、逗号和括号。

| 想改的东西                           | 对应字段                                                                                       |
| ------------------------------------ | ---------------------------------------------------------------------------------------------- |
| 左上角应用名、中英文名               | `brand.name`、`brand.english`                                                                  |
| 两个导航名、图鉴入口                 | `nav.home`、`nav.journal`、`nav.atlas`                                                         |
| 首页大标题与副标题                   | `home.title`、`home.titleAccent`、`home.subtitle`                                              |
| 左上角星海标题                       | `scene.name`                                                                                   |
| 旋臂 / 非饭点状态文字                | `scene.inArm`、`scene.betweenArms`、`scene.armCaption`、`scene.gapCaption`                     |
| 小吞的名字、对白                     | `scene.mascotLabel`、`scene.thinking`、`scene.approaching`、`scene.arrived`、`scene.satisfied` |
| 右侧面板、时间/位置/心情标签         | `controls` 下相应字段                                                                          |
| 主按钮“吃什么？”                     | `controls.draw`                                                                                |
| 重抽、正在寻找、没到饭点提示         | `controls.redraw`、`controls.drawing`、`controls.empty`                                        |
| 推荐结果提示与操作                   | `result` 下相应字段                                                                            |
| 日志页大标题                         | `journal.title`、`journal.titleAccent`、`journal.subtitle`                                     |
| 记录表单标题、保存按钮和短评占位文字 | `meal` 下相应字段                                                                              |
| 页脚文字                             | `footer` 下相应字段                                                                            |

例如可以改为：

```ts
home: {
  eyebrow: "A LITTLE HUNGRY, A LITTLE CURIOUS",
  title: "今天也在漂泊，",
  titleAccent: "先吃口星星。",
  subtitle: "随机不是答案，是出发的理由。",
},
```

首页没有推荐结果时不显示固定气泡；对白主要在寻找、到达和吃完时出现。修改 `scene.thinking` 不会让闲置场景自动出现气泡。

## 2. 食堂介绍、恒星名字、评价：`src/data.ts`

找到对应食堂对象，修改：

- `name`：显示名称。
- `star` / `code`：中文星体类型、英文标记。
- `description`：你的主观评价。
- `metaphor`：为什么选这种恒星。
- `area`：位置文字；地点下拉框还可在下方 `places` 调整。
- `companions` 中的 `name` / `note`：伴星名称与说明。
- `moods` 中的 `name` / `description`：心情名称和说明。

保留 `id` 不变，它关联现有记录。`tags`、`preferences` 是程序使用并保存的数据值，不能仅当显示文字随意改名；如要改偏好类别，要同步类型、食堂标签和旧记录兼容逻辑。

## 3. 其他文字

- 部分表单字段、统计名称、设置说明、提示消息：`src/App.tsx`，直接搜索网页上那句话。
- 自动推荐理由：`src/engine.ts`。
- 备份格式和存储报错：`src/storage.ts`。
- 浏览器标签页的标题与描述：`index.html`。

## 4. 如果还想改画面

- `src/Galaxy.tsx`：局部星海、背景漂流速度、星点数量、饭点星云密度。`anchors` 只管可交互恒星的初始画面位置，与校园距离无关。
- `src/styles.css`：靠近末尾的 `Local flight view` 段，控制小吞大小、光晕、标签、场景提示等。
- `src/StarBody.tsx`：图鉴和局部星海共用的恒星外观结构。

调时间到 12:00 可预览旋臂内，15:00 预览臂间，21:00 是桃李仍供餐的夜宵时段，也算旋臂内。手动改时间后不再自动跳回；点“现在”恢复跟随系统时间，每 15 秒更新一次。
