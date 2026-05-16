[README.md](https://github.com/user-attachments/files/27840448/README.md)
# Markdown Editor

一个基于 **Electron + React + CodeMirror 6** 构建的现代化 Markdown 桌面编辑器。

## 功能特性

- **所见即所得编辑** — 基于 CodeMirror 6 的 Markdown 编辑体验，支持语法高亮和实时格式化装饰
- **丰富排版** — 粗体、斜体、粗斜体、删除线、高亮、行内代码、链接、图片
- **块级元素** — 标题 H1-H6、引用、代码块、有序/无序列表、任务列表、表格、分隔线、数学公式（KaTeX）
- **交互式任务列表** — 点击复选框直接切换 `[x]` / `[ ]`
- **代码块折叠预览** — 光标离开时代码块折叠为样式化预览面板
- **数学公式** — 支持行内 `$...$` 和块级 `$$...$$` 公式，集成 KaTeX 实时渲染
- **文件管理** — 新建、打开、保存、另存为，支持文件夹浏览侧栏
- **导出** — 导出为 HTML 或 PDF（保留暗色/亮色主题样式）
- **暗色模式** — 一键切换亮色/暗色主题
- **可定制设置** — 字体大小、行号、自动换行、编辑器宽度、自动保存等
- **窗口控制** — 无边框窗口，Windows 风格标题栏按钮（最小化 / 最大化还原 / 关闭）
- **自动保存** — 可配置自动保存间隔
- **字数统计 & 光标位置** — 底部状态栏实时显示
- **智能硬换行** — 基于视觉坐标检测的自动换行

## 技术栈

| 技术 | 用途 |
|---|---|
| Electron 28 | 桌面应用框架 |
| React 18 | UI 框架 |
| CodeMirror 6 | 代码编辑器核心 |
| TypeScript | 类型安全 |
| Vite | 构建工具 |
| Tailwind CSS | 样式 |
| KaTeX | 数学公式渲染 |
| marked | Markdown → HTML 转换 |
| Lucide React | 图标库 |

## 开始使用

```bash
# 安装依赖
npm install

# 启动开发模式（Vite + Electron 并发）
npm start

# 生产构建并运行
npm run build
npm run electron:dev
```

## 快捷键

| 快捷键 | 功能 |
|---|---|
| `Ctrl+N` | 新建 |
| `Ctrl+O` | 打开 |
| `Ctrl+S` | 保存 |
| `Ctrl+Shift+S` | 另存为 |
| `Ctrl+Z` | 撤销 |
| `Ctrl+Shift+Z` | 重做 |
| `Ctrl+Shift+H` | 导出 HTML |
| `Ctrl+Shift+P` | 导出 PDF |
| `Ctrl+Q` | 退出 |

## 项目结构

```
├── electron/             # Electron 主进程
│   ├── main.ts           # 主进程入口、IPC 通信、菜单
│   └── preload.ts        # 预加载脚本（contextBridge API）
├── src/                  # 渲染进程
│   ├── components/       # React 组件
│   │   ├── Editor.tsx        # CodeMirror 编辑器核心
│   │   ├── Toolbar.tsx       # 顶部工具栏
│   │   ├── InlineToolbar.tsx # 选中文本时的浮动工具栏
│   │   ├── Sidebar.tsx       # 文件夹浏览侧栏
│   │   ├── WelcomePage.tsx   # 欢迎页
│   │   ├── SettingsPanel.tsx # 设置面板
│   │   ├── StatusBar.tsx     # 底部状态栏
│   │   ├── WindowControls.tsx # 窗口控制按钮
│   │   ├── FormulaDialog.tsx # 数学公式插入对话框
│   │   └── MathWidget.tsx    # 数学公式渲染装饰
│   ├── App.tsx           # 应用根组件
│   ├── index.css         # 全局样式
│   ├── main.tsx          # 渲染进程入口
│   ├── types.ts          # 类型定义
│   └── vite-env.d.ts     # Electron API 类型声明
└── package.json
```

## 开发

```bash
# 代码检查
npm run lint

# 格式化
npm run format
```
