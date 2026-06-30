# ✦ CodePage — AI-Powered Visual Page Builder

**把你的想法，变成私有部署的代码。**

**CodePage** 是一个开源的全栈 AI 页面构建工具。通过自然语言描述 UI 需求，即时生成 **HTML / React JSX / Vue 3 SFC** 三端可运行代码，并支持实时预览、可视化编辑和全栈智能体自动生成。

> 🔒 代码不上传第三方 · 兼容云端 API + Ollama 本地离线运行 · 数据 100% 本地私有

---

## 目录

- [核心功能](#-核心功能)
- [技术栈](#-技术栈)
- [快速开始](#-快速开始)
- [使用流程](#-使用流程)
- [支持的 LLM 供应商](#-支持的-llm-供应商)
- [多语言支持](#-多语言支持)
- [项目结构](#-项目结构)
- [API 参考](#-api-参考)
- [Docker 部署](#-docker-部署)
- [开源协议](#-开源协议)

---

## ✨ 核心功能

### 🤖 AI 代码生成
自然语言 → 即时生成结构完整、可直接运行的 **HTML / React (JSX) / Vue 3 (SFC)** 代码。兼容任意 OpenAI 标准 API。

### 🧠 智能体编排
全栈项目一键生成：**Planner → Schema → Backend → Frontend → Integrator** 五阶段智能体流水线自动编排。支持后台异步执行，实时推送进度，完成后自动加载代码到工作区。

### 👁️ 实时预览
HTML 输出即时渲染到 iframe 沙箱，支持 **桌面端** / **移动端** 双模式切换，预览即所得。

### ✂️ 可视化编辑器（HTML 模式）
代码自动拆分为 **结构** / **样式** / **脚本** 三栏，独立编辑，修改即时反馈到预览。

### 📁 项目管理
项目分组管理页面，支持完整增删改查与页面拖拽排序。

### 📋 生成历史
每次生成自动保存，可回溯加载，上限通过 `HISTORY_MAX` 环境变量自定义。

### 🏷️ 模板系统
- 6 个预制模板（暗黑登录、响应式导航、产品卡片等）
- 4 种样式标签（深色/响应式/Tailwind/动画）
- **JSON 导入导出** — 社区模板互相分享
- **自定义模板** — localStorage 持久化

### 🔧 代码工具
格式化 · 压缩 · 复制 · 下载（.html / .jsx / .vue）

### 🔄 智能体自愈循环
生成代码后自动运行静态检查（HTML 标签闭合、CSS 花括号匹配、JS 括号匹配等），发现错误自动调用 LLM 修正，无需人工介入，大幅提升生成成功率。

### 🌐 多语言支持
内置 **中文** / **English** 双语界面，顶部导航栏一键切换，选择保存在 localStorage，刷新后保留。

---

## 🏗 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 19 + Vite 6 + TypeScript 5.7 |
| 后端 | Express 4 + TypeScript 5.7 |
| 数据库 | SQLite（Prisma 6 ORM，零外部依赖） |
| LLM | OpenAI 兼容 API（多供应商 + Ollama 本地离线） |
| 国际化 | i18next + react-i18next |
| 容器 | Docker + Docker Compose |
| 运行时 | Node.js 20+ |

---

## 🚀 快速开始

### 环境要求
- Node.js **≥20**
- npm **≥9**
- Docker **≥24**（仅生产部署需要）

### 方式一：一键安装（推荐）

```bash
# Windows PowerShell
.\scripts\setup.ps1

# Linux / macOS
bash scripts/setup.sh
```

### 方式二：手动安装

```bash
# 1. 安装依赖
cd server && npm install && cd ../client && npm install && cd ..

# 2. 初始化数据库
cd server && npx prisma generate && npx prisma db push && cd ..

# 3. 配置环境变量
# 复制 .env 文件，填入真实 API Key

# 4. 启动前后端
npm run dev
```

### 方式三：生产模式（Docker）

```bash
docker-compose -f docker/docker-compose.yml up -d
```

启动后访问 **http://localhost:3000**。

### 方式四：无 Node.js 环境

项目已预编译 `EdgeOne Pages`，将 `client/dist` 部署到静态托管平台 + Node.js 后端分离部署。

---

## 📖 使用流程

### 页面构建器模式

```
输入提示词 → 选择模板 → 选择格式 → 勾选样式标签 → ⚡ 生成
```

1. 点击 ⚙ **Settings** 配置 LLM 供应商
2. 在输入框用自然语言描述 UI 需求
3. 可选：点击模板快捷填充提示词 / 勾选样式标签
4. 选择输出格式：**HTML** / **React** / **Vue**
5. 点击 **✨ Generate**
6. 在 **📄 Source** / **🎨 Editor** 标签中编辑调整
7. 使用 **Copy** / **Download** / **Export** 导出

### 智能体构建模式

```
描述需求 → 智能体自动编排 → 后台异步执行 → 实时查看进度 → 加载代码
```

1. 切换到 **Agent Build** 标签页
2. 描述全栈项目需求（如："构建一个带用户认证和看板的任务管理器"）
3. 点击 **Start Agent Build**
4. 系统自动执行：Planner → Schema → Backend → Frontend → Integrator
5. 实时查看每个智能体的执行状态和输出
6. 完成后一键加载前端代码到工作区

---

## 🔌 支持的 LLM 供应商

| 供应商 | API 地址 | 鉴权方式 | 说明 |
|--------|---------|---------|------|
| **DeepSeek** | `api.deepseek.com/v1/chat/completions` | Bearer | 💰 性价比高，中文理解好 |
| **OpenAI** | `api.openai.com/v1/chat/completions` | Bearer | 🌐 通用最强，需海外网络 |
| **月之暗面** | `api.moonshot.cn/v1/chat/completions` | Bearer | 🇨🇳 国内直连，长上下文 |
| **通义千问** | `dashscope.aliyuncs.com/compatible-mode/v1/chat/completions` | Bearer | ⚡ 国内直连稳定 |
| **智谱 GLM** | `open.bigmodel.cn/api/paas/v4/chat/completions` | Bearer | 🆓 免费额度 |
| **SenseNova/NEO** | `token.sensenova.cn/v1/chat/completions` | Bearer | 商汤大模型 |
| **MiniMax** | `api.minimaxi.com/v1/chat/completions` | Bearer | 国内供应商 |
| **零一万物** | `api.lingyiwanwu.com/v1/chat/completions` | Bearer | 国内供应商 |
| **阶跃星辰** | `api.stepfun.com/v1/chat/completions` | Bearer | 国内供应商 |
| **SiliconFlow** | `api.siliconflow.cn/v1/chat/completions` | Bearer | 聚合平台 |
| **幻城网安公益** | `api.iamhc.cn/v1` | None | 🆓 免费公益 API |
| **Ollama（本地）** | `localhost:11434/v1/chat/completions` | 任意值 | 🔒 **本地离线，无需 Key** |
| **API2D** | `api.api2d.com/v1/chat/completions` | Bearer | 🔁 OpenAI 代理 |

### 鉴权方式
- **Bearer Token** — 标准 `Authorization` 请求头
- **x-api-key** / **api-key** — 自定义请求头
- **None** — 无需认证（如幻城网安公益 API）

---

## 🌐 多语言支持

项目内置 **中文** 和 **English** 双语支持：

- 顶部导航栏右侧 `🌐 语言 / Language` 下拉框一键切换
- 默认跟随系统或之前选择
- 所有 UI 界面实时切换，无需刷新

### 添加新语言

1. 在 `client/src/locales/` 下新建 `{lang}.json` 翻译文件
2. 在 `client/src/i18n.ts` 的 `resources` 中注册
3. 在 `Header.tsx` 的 `LANGUAGES` 数组中添加选项

---

## 📁 项目结构

```
codepage/
├── .env.example                 # 环境变量模板
├── package.json                 # 根工作区脚本
├── start-server.vbs             # Windows 后台启动脚本
│
├── scripts/                     # 安装 & 工具脚本
│   ├── setup.ps1                # Windows 一键安装
│   ├── setup.sh                 # Linux/macOS 一键安装
│   └── setup.js                 # Node.js 通用安装
│
├── client/                      # React 前端
│   ├── src/
│   │   ├── components/          # UI 组件（8个）
│   │   │   ├── Header.tsx       # 顶栏：导航、状态、语言切换
│   │   │   ├── Sidebar.tsx      # 侧栏：项目/历史
│   │   │   ├── Workspace.tsx    # 工作区：输入、代码、预览
│   │   │   ├── AgentPanel.tsx   # 智能体编排器
│   │   │   ├── ConsolePanel.tsx # 控制台日志
│   │   │   ├── SettingsModal.tsx# 设置弹窗
│   │   │   ├── VisualEditor.tsx # 可视化编辑器
│   │   │   └── Toast.tsx        # 消息提示
│   │   ├── locales/             # 国际化翻译文件
│   │   │   ├── en.json          # English
│   │   │   └── zh.json          # 中文
│   │   ├── stores/              # 全局状态（AppStore）
│   │   ├── types/               # TypeScript 类型定义
│   │   ├── utils/               # API 客户端 & 工具函数
│   │   ├── i18n.ts              # i18next 初始化
│   │   ├── App.tsx              # 根组件
│   │   └── main.tsx             # 入口
│   └── ...config files
│
├── server/                      # Express 后端
│   ├── prisma/
│   │   ├── schema.prisma        # 数据库模型
│   │   └── data/                # SQLite 数据 & LLM 配置（持久化）
│   └── src/
│       ├── index.ts             # 服务入口
│       ├── agent/               # 智能体系统
│       │   ├── orchestrator.ts  # 编排器核心
│       │   ├── planner.ts       # 规划智能体
│       │   ├── schema.ts        # 架构智能体
│       │   ├── backend.ts       # 后端智能体
│       │   ├── frontend.ts      # 前端智能体
│       │   ├── integrator.ts    # 集成智能体
│       │   ├── types.ts         # 类型定义
│       │   └── utils.ts         # 工具函数
│       ├── routes/
│       │   ├── api.ts           # 项目/页面/历史 API
│       │   ├── agent.ts         # 智能体运行 API
│       │   ├── llm.ts           # LLM 配置/生成/测试 API
│       │   └── console.ts       # 控制台日志 API
│       └── utils/
│           ├── llm.ts           # LLM 适配器（fetch + normalizeUrl）
│           ├── agent-config.ts  # 配置管理
│           └── logger.ts        # 日志系统
│
├── docker/                      # Docker 部署
│   └── docker-compose.yml
│
├── docs/                        # 文档
│   └── screenshots/
│
├── functions/                   # EdgeOne Pages Functions
└── .github/                     # Issue 模板
```

---

## 📡 API 参考

### 系统
| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/health` | 健康检查 |
| `GET` | `/api/console/logs` | 控制台日志 |

### LLM 配置
| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/config` | 获取配置（含 .env 默认值，Key 脱敏） |
| `POST` | `/api/config` | 保存配置 |
| `POST` | `/api/test` | 测试 LLM 连接 |
| `GET` | `/api/models` | 拉取可用模型列表 |
| `POST` | `/api/generate` | 生成代码 |

### 项目管理
| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/projects` | 项目列表 |
| `POST` | `/api/projects` | 创建项目 |
| `PUT` | `/api/projects/:id` | 重命名 |
| `DELETE` | `/api/projects/:id` | 删除项目 |
| `POST` | `/api/projects/:id/pages` | 添加页面 |
| `PUT` | `/api/pages/:id` | 更新页面 |
| `DELETE` | `/api/pages/:id` | 删除页面 |
| `PATCH` | `/api/pages/reorder` | 页面排序 |

### 历史记录
| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/history` | 历史列表 |
| `POST` | `/api/history` | 保存记录 |
| `DELETE` | `/api/history` | 清空历史 |

### 智能体
| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/agent/runs` | 运行列表 |
| `POST` | `/api/agent/runs` | 创建运行 |
| `GET` | `/api/agent/runs/:id` | 运行详情（含任务） |
| `POST` | `/api/agent/runs/:id/execute` | 后台执行 |
| `DELETE` | `/api/agent/runs/:id` | 删除运行 |

---

## 🐳 Docker 部署

```bash
docker-compose -f docker/docker-compose.yml up -d
```

数据卷持久化：
- `docker/data/data.db` — SQLite 数据库
- `docker/data/llm-config.json` — LLM 配置

容器删除后重启数据不丢失。

---

## 📄 开源协议

MIT License — 免费商用、二次修改、私有化部署。

---

<p align="center">
  Built with ❤️ · <a href="https://github.com/your-org/codepage">GitHub</a><br>
  <sub>MIT Licensed · Free for any use</sub>
</p>
