<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-6366f1" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
  <img src="https://img.shields.io/github/stars/your-org/codepage?style=flat&color=ffd700" alt="Stars">
  <img src="https://img.shields.io/github/forks/your-org/codepage?style=flat&color=ff69b4" alt="Forks">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs Welcome">
  <img src="https://img.shields.io/badge/React-19-61dafb" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178c6" alt="TypeScript">
  <img src="https://img.shields.io/badge/Docker-ready-2496ed" alt="Docker">
  <img src="https://img.shields.io/badge/Node-20%2B-339933" alt="Node">
</p>

<h1 align="center">✦ CodePage</h1>
<p align="center"><strong>把你的想法，变成私有部署的代码</strong><br>
AI-Powered Visual Page Builder — 私有化本地部署，代码不上传第三方</p>

<p align="center">
  🎯 面向前端开发者 · 外包接单 · 低代码从业者 · 独立开发者<br>
  一句话描述 UI → 即时生成 <b>HTML / React (JSX) / Vue 3 (SFC)</b> 三端可运行代码
</p>

<p align="center">
  🔒 纯本地运行 · 兼容云端 API + <b>Ollama 本地大模型离线运行</b> · Docker 一键部署
</p>

<p align="center">
  <a href="#-quick-start"><b>🚀 Quick Start</b></a> ·
  <a href="#-features"><b>✨ Features</b></a> ·
  <a href="#-architecture"><b>🏗 Architecture</b></a> ·
  <a href="#-roadmap"><b>🗺 Roadmap</b></a> ·
  <a href="#-faq"><b>❓ FAQ</b></a>
</p>

<p align="center">
  <a href="https://render.com/deploy?ref=your-org/codepage">
    <img src="https://img.shields.io/badge/Deploy_to-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white" alt="Deploy to Render">
  </a>
  <a href="https://railway.app/template/your-template">
    <img src="https://img.shields.io/badge/Deploy_to-Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white" alt="Deploy to Railway">
  </a>
</p>

---

## 📸 演示

<p align="center">
  <i>（开源后替换为真实的 GIF 动图和截图）</i>
</p>

<p align="center">
  <img src="docs/screenshots/demo.gif" width="80%" alt="CodePage 生成流程演示 GIF" style="border-radius:8px;border:1px solid #333">
  <br>
  <em>🎥 演示：输入提示词 → 生成代码 → 实时预览 → 可视化编辑</em>
</p>

<p align="center">
  <img src="docs/screenshots/editor.png" width="48%" alt="编辑器界面" style="border-radius:6px;border:1px solid #333">
  <img src="docs/screenshots/preview.png" width="48%" alt="实时预览" style="border-radius:6px;border:1px solid #333">
  <br>
  <img src="docs/screenshots/settings.png" width="48%" alt="设置弹窗" style="border-radius:6px;border:1px solid #333">
  <img src="docs/screenshots/mobile.png" width="48%" alt="移动端预览" style="border-radius:6px;border:1px solid #333">
</p>

---

## ✨ Features

### 🤖 AI 代码生成
自然语言描述 UI 需求，即时生成结构完整、可直接运行的 HTML / React / Vue 代码。  
兼容**任意 OpenAI 标准 API** — DeepSeek、OpenAI、MoonShot、**Ollama（本地离线）** 等。

### 🎨 多框架输出
| 格式 | 说明 |
|------|------|
| HTML | 完整单页面，内嵌 CSS + JS |
| React (JSX) | 函数组件 + Hooks |
| Vue 3 (SFC) | Composition API 单文件组件 |

### 👁️ 实时预览
HTML 输出即时渲染，支持**桌面端** / **移动端**双模式切换。

### ✂️ 可视化编辑器 (HTML 模式)
将代码拆分为 **结构** / **样式** / **脚本** 三栏独立编辑，修改即时反馈到预览。

### 📁 项目管理
项目分组管理页面，支持完整的增删改查与页面排序。

### 📋 生成历史
自动保存每次生成记录，可回溯加载，上限可通过 `HISTORY_MAX` 环境变量自定义。

### 🏷️ 模板系统
**预制模板**：暗黑登录、响应式导航、产品卡片等  
**样式标签**：Dark / Responsive / Tailwind / Animated  
**⭐ 模板导入导出**：社区模板可 JSON 格式互相分享  
**自定义模板**：localStorage 持久化，支持社区生态

### 🔧 代码工具
格式化 · 压缩 · 复制 · 下载（.html/.jsx/.vue）

### 🔄 智能体自愈循环
生成代码后自动运行静态检查（HTML 标签闭合、CSS 花括号匹配、JS 括号匹配等），发现错误自动重试修正，无需人工介入。

### 🌐 多语言支持
内置 **中文** / **English** 双语界面，顶部导航栏一键切换，选择持久化保存。

### ⭐ 特色独有功能
- **本地离线大模型**：支持 Ollama，无需联网、无需 API Key，数据不出本机
- **模板导入/导出**：社区模板 JSON 格式互相分享
- **智能体自愈**：自动检测修复代码错误
- **中断生成**：耗时过长可随时取消 LLM 请求
- **14 家 LLM 供应商预设**：一键切换，自动填充模型名
- **配置持久化**：LLM 配置跨重启保留，用户偏好通过 localStorage 持久化

### 🐳 Docker 支持
一行命令生产环境部署，数据卷持久化，重启不丢失。

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                           │
│  ┌─────────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │  Sidebar     │  │ Workspace│  │   Preview Panel   │  │
│  │  · Projects  │  │ · Prompt │  │  ┌─────────────┐ │  │
│  │  · History   │  │ · Code   │  │  │ iframe/srcdoc│ │  │
│  └──────┬───────┘  │ · Editor │  │  └─────────────┘ │  │
│         │          └────┬─────┘  └────────┬──────────┘  │
│         └───────────────┼─────────────────┘             │
│                         │ HTTP REST API                  │
└─────────────────────────┼───────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────┐
│              Express Server                              │
│  ┌──────────┐  ┌────────┴────────┐  ┌───────────────┐  │
│  │ API      │  │  LLM Router     │  │  Config Store │  │
│  │ Routes   │  │  · /generate    │  │  (JSON file)  │  │
│  │ · /api/  │  │  · /config      │  └───────┬───────┘  │
│  │ projects │  │  · /models      │          │          │
│  │ · /pages │  └────────┬────────┘          │          │
│  │ · /history│          │                    │          │
│  └─────┬────┘           │                    │          │
│        │                │                    │          │
│  ┌─────┴──────┐  ┌──────┴──────────┐         │          │
│  │  Prisma    │  │   LLM Adapter   │         │          │
│  │  (SQLite)  │  │   (fetch API)   │         │          │
│  └────────────┘  └──────┬──────────┘         │          │
└─────────────────────────┼────────────────────┼──────────┘
                          │                    │
              ┌───────────┴────┐               │
              │   LLM API      │               │
              │  (OpenAI 兼容)  │               │
              │  · DeepSeek    │               │
              │  · OpenAI      │               │
              │  · Ollama (local)              │
              │  · 通义千问     │               │
              └────────────────┘               │
                                      ┌───────┴────────┐
                                      │  prisma/data/  │
                                      │  · data.db      │
                                      │  · llm-config.json│
                                      └────────────────┘
```

### 数据流
```
User Input (prompt) 
    → Workspace (React)
    → POST /api/generate (Express)
    → LLM Adapter (fetch to OpenAI-compatible API)
    → Response → Extract code block
    → Update store → Render preview (iframe srcdoc)
```

---

## 🚀 Quick Start

### 环境要求
- Node.js **≥20**
- npm **≥9**
- Docker **≥24** (仅生产部署需要)

### 开发模式

**方式一：一键脚本（推荐）**

```bash
# Windows PowerShell
.\scripts\setup.ps1

# Linux / macOS
bash scripts/setup.sh
```

**方式二：手动安装**

```bash
# 1. 安装依赖
cd server && npm install && cd ../client && npm install && cd ..

# 2. 初始化数据库
cd server && npx prisma generate && npx prisma db push && cd ..

# 3. 启动前后端
npm run dev
```

打开 **http://localhost:5173** → ⚙ 设置 → 配置 API Key → 开始生成！

### 生产模式 (Docker)

```bash
docker-compose -f docker/docker-compose.yml up -d
```

访问 **http://localhost:3000**

### 一键云部署

[![Deploy to Render](https://img.shields.io/badge/Deploy_to-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com/deploy?ref=your-org/codepage)
[![Deploy to Railway](https://img.shields.io/badge/Deploy_to-Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)](https://railway.app/template/your-template)

> 部署前请配置 `LLM_API_KEY` 和 `LLM_BASE_URL` 环境变量。

---

## 📖 Usage Guide

### 界面总览

| 区域 | 功能 |
|------|------|
| **顶栏** | 项目标题、API 连接状态、设置入口、刷新按钮 |
| **侧边栏** | 📁 项目管理 / 📋 历史记录 双标签切换 |
| **工作区** | 输入提示词 → 选择模板 → 选择格式 → 生成 |
| **代码区** | 📄 源码 / 🎨 可视化编辑器 双标签切换 |
| **预览区** | 实时渲染 + 🖥 桌面 / 📱 移动端切换 |

### 四步使用流程

#### 1️⃣ 配置大模型
1. 点击顶栏 **⚙ Settings**
2. 选择供应商预设（DeepSeek / OpenAI / 通义千问 等）或输入自定义 API URL
3. 填入 API Key 和模型名
4. 点击 **Save & Test** 验证连接

> 💡 Ollama 本地模型：URL 填 `http://localhost:11434/v1/chat/completions`，Key 任意值即可

#### 2️⃣ 生成代码
1. 在输入框描述 UI 需求
2. 可选：点击模板快捷填充提示词
3. 选择输出格式：**HTML** / **React** / **Vue**
4. 可选：勾选样式标签（Dark / Responsive / Tailwind / Animated）
5. 点击 **✨ Generate**

#### 3️⃣ 编辑调整
- **📄 Source 标签**：查看和编辑原始代码
- **🎨 Editor 标签**：可视化编辑（HTML 模式），分别修改结构 / 样式 / 脚本
- 预览区实时反馈修改效果

#### 4️⃣ 保存与导出
- 代码自动保存到当前项目
- 使用 **Copy** / **Download** 导出单文件
- 使用 **📤 Export** 导出模板 JSON 分享给社区

---

## 🔧 Configuration

### 环境变量

复制 `.env.example` 为 `.env`：

```bash
# Ollama 本地模型配置示例
LLM_PROVIDER=ollama
LLM_BASE_URL=http://localhost:11434
LLM_API_KEY=ollama    # Ollama 不需要真实 Key
LLM_MODEL=llama3.2
```

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 服务端口 | `3000` |
| `NODE_ENV` | 运行环境 | `development` |
| `LLM_PROVIDER` | 供应商名称 | `deepseek` |
| `LLM_BASE_URL` | API 地址 | `https://api.deepseek.com` |
| `LLM_API_KEY` | API 密钥 | — |
| `LLM_MODEL` | 主模型 | `deepseek-chat` |
| `LLM_MINOR_MODEL` | 轻量模型（可选） | `deepseek-chat` |
| `HISTORY_MAX` | 历史记录上限（可自定义） | `200` |

### 支持的 LLM 供应商

| 供应商 | API 地址 | 推荐模型 | 鉴权方式 | 提示 |
|--------|---------|---------|---------|------|
| **DeepSeek** | `https://api.deepseek.com/v1/chat/completions` | `deepseek-chat` | Bearer Token | 💰 性价比高，中文理解好 |
| **OpenAI** | `https://api.openai.com/v1/chat/completions` | `gpt-4o` / `gpt-4o-mini` | Bearer Token | 🌐 通用最强，需海外网络 |
| **MoonShot (月之暗面)** | `https://api.moonshot.cn/v1/chat/completions` | `moonshot-v1-8k` | Bearer Token | 🇨🇳 国内直连，长上下文 |
| **通义千问 (Qwen)** | `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions` | `qwen-turbo` / `qwen-max` | Bearer Token | ⚡ 国内直连稳定，延迟低 |
| **智谱 GLM** | `https://open.bigmodel.cn/api/paas/v4/chat/completions` | `glm-4` / `glm-4-flash` | Bearer Token | 🆓 国内直连，免费额度 |
| **API2D** | `https://api.api2d.com/v1/chat/completions` | 各类代理模型 | Bearer Token | 🔁 OpenAI 代理 |
| **Ollama (本地)** | `http://localhost:11434/v1/chat/completions` | `llama3.2` / `qwen2.5` | 任意值 | ⭐ **无需 API Key，本地离线运行** |
| **自定义 (OpenAI 兼容)** | 自定义 URL | 自定义 | Bearer / x-api-key / api-key | ✅ 兼容全部 OpenAI 标准格式 |

### 模型配置详细说明

**鉴权方式说明：**
- **Bearer Token** — 标准 Authorization 请求头，适用于大多数供应商
- **x-api-key** — 自定义请求头，部分私有部署使用
- **api-key** — 自定义请求头，部分国内 API 使用

**Settings 弹窗内可配置项：**

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| API URL | LLM 服务完整地址 | — |
| Auth Type | 鉴权方式 | Bearer |
| API Key | 密钥 | — |
| Model | 模型名称 | — |
| Temperature | 生成温度 (0-2) | 0.7 |
| Max Tokens | 最大输出长度 | 4096 |
| System Prompt | 系统提示词（可选） | 内置格式提示 |

---

## 📁 Project Structure

```
codepage/
├── .env.example              # 环境变量模板
├── scripts/                  # 📂 工具脚本
│   ├── setup.ps1             # Windows 一键安装
│   └── setup.sh              # Linux/macOS 一键安装
├── client/                   # 📂 React 前端
│   └── src/
│       ├── components/       # UI 组件
│       ├── stores/           # 全局状态管理
│       ├── types/            # TypeScript 类型
│       └── utils/            # API 客户端 & 工具函数
├── server/                   # 📂 Express 后端
│   ├── prisma/               # 数据库 schema
│   │   └── data/             # SQLite 数据库 + LLM 配置（持久化）
│   └── src/
│       ├── routes/           # API 路由
│       └── utils/            # LLM 适配器
├── docker/                   # 📂 Docker 部署
├── .github/                  # 📂 开源配置
├── CONTRIBUTING.md           # 贡献指南
└── CHANGELOG.md              # 更新日志
```

---

## 📡 API Reference

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/health` | 健康检查 |
| `GET` | `/api/config` | 获取 LLM 配置（Key 脱敏） |
| `POST` | `/api/config` | 保存 LLM 配置 |
| `POST` | `/api/test` | 测试 LLM 连接 |
| `GET` | `/api/models` | 拉取可用模型列表 |
| `POST` | `/api/generate` | 生成代码 |
| `GET` | `/api/projects` | 项目列表 |
| `POST` | `/api/projects` | 创建项目 |
| `GET` | `/api/projects/:id` | 项目详情（含页面） |
| `PUT` | `/api/projects/:id` | 重命名项目 |
| `DELETE` | `/api/projects/:id` | 删除项目 |
| `POST` | `/api/projects/:id/pages` | 添加页面 |
| `PUT` | `/api/pages/:id` | 更新页面 |
| `DELETE` | `/api/pages/:id` | 删除页面 |
| `PATCH` | `/api/pages/reorder` | 页面排序 |
| `GET` | `/api/history` | 历史记录 |
| `POST` | `/api/history` | 保存历史 |
| `DELETE` | `/api/history` | 清空历史 |

---

## 🗺 Roadmap

### v1.0 (当前)
- [x] AI 代码生成（HTML / React / Vue）
- [x] 实时预览 + 可视化编辑
- [x] 项目管理 + 生成历史
- [x] 模板系统 + 样式标签
- [x] 多 LLM 供应商支持（含 Ollama 本地）
- [x] Docker 一键部署
- [x] 模板导入导出
- [x] 配置持久化 + 用户偏好

### v1.1 (规划中)
- [ ] 流式输出 — 实时展示生成代码，无需等待完整返回
- [ ] 超时自动重试 — LLM 请求超时后自动重试
- [ ] React / Vue 可视化编辑 — 补齐 JSX / SFC 编辑能力
- [ ] 自定义预览尺寸 + 缩放比例
- [ ] 深色 / 浅色预览背景切换
- [ ] 完整工程导出 — React / Vue 迷你项目打包下载

### v1.2 (长期规划)
- [ ] 业务模板库扩充 — 管理后台、官网首页、登录注册等
- [ ] 提示词预设库 — 内置 UI 描述模板，减少用户输入
- [ ] 本地多账号 — 单设备多工作区切换
- [ ] 生成代码一键引入 Tailwind 样式
- [ ] 导出 PDF / 图片预览页面
- [ ] 社区模板市场 — 在线浏览和导入社区模板

---

## ❓ FAQ

### 预览白屏怎么办？
- 确保使用 **HTML** 格式（React/Vue 输出无法在浏览器沙箱中渲染）
- 查看浏览器控制台有无报错
- 点击 **Format** 修复可能格式错误的 HTML

### LLM 生成超时 / 报错如何排查？
1. 在 **Settings** 中点击 **Test Connection** 测试连接是否正常
2. 检查 API Key 和模型名是否正确
3. 如果使用 Ollama，确认 Ollama 服务已启动：`ollama serve`
4. 如果生成过长，可使用 **Cancel** 按钮中断后调整提示词重试

### 如何切换到 Ollama 本地模型？
```bash
# .env 文件配置
LLM_BASE_URL=http://localhost:11434
LLM_API_KEY=ollama
LLM_MODEL=llama3.2
# 或运行: ollama run llama3.2
```
然后在设置中填入：URL `http://localhost:11434/v1/chat/completions`，Key 任意值。

### Docker 部署后数据如何持久化？
`docker-compose.yml` 已配置数据卷挂载，容器删除后重启数据不丢失：
- SQLite 数据库 → `docker/data/data.db`
- LLM 配置 → `docker/data/llm-config.json`

### 如何重置数据库？
删除 `server/prisma/data/data.db`，重新运行 `npx prisma db push`。

### 端口 5173 / 3000 被占用？
在 `.env` 中设置 `PORT=3001` 修改后端端口；前端端口通过 `client/vite.config.ts` 配置。

### 如何参与贡献模板？
参见 [CONTRIBUTING.md](CONTRIBUTING.md)。提交 PR 或在 GitHub Issues 中分享你的模板 JSON。

---

## 🤝 Contributing

欢迎各类贡献！详见 [CONTRIBUTING.md](CONTRIBUTING.md)

- 🐛 **报告 Bug** → [新建 Issue](https://github.com/your-org/codepage/issues/new?template=bug_report.md)
- 💡 **功能建议** → [Feature Request](.github/ISSUE_TEMPLATE/feature_request.md)
- 🔧 **提交 PR** → Fork → 分支开发 → PR
- 📝 **添加模板** → 扩展 `BUILTIN_TEMPLATES` 或导出 JSON 分享

### 开发指引

```bash
# 本地开发
npm run dev              # 同时启动前后端
npm run dev:server       # 仅启动后端
npm run dev:client       # 仅启动前端

# 构建
npm run build            # 构建前后端

# 数据库
cd server && npx prisma studio   # 可视化数据库管理
```

---

## 🎯 Good First Issues

项目代码结构清晰（仅 8 个前端组件 + 5 个智能体模块），非常适合首次参与开源贡献。以下是一些适合新手的入门任务：

| 任务 | 涉及文件 | 难度 | 预估时间 |
|------|---------|------|---------|
| 新增 Svelte 输出格式 | `client/src/`, `server/src/utils/llm.ts` | 中等 | 2-4h |
| 自定义预览尺寸 + 缩放 | `client/src/components/Workspace.tsx` | 简单 | 1-2h |
| 深色/浅色预览背景切换 | `client/src/components/Workspace.tsx` | 简单 | 1h |
| 新增语言（日/韩/法） | `client/src/locales/` | 简单 | 1h |
| 生成代码一键引入 Tailwind | `server/src/utils/llm.ts` | 中等 | 2-3h |
| 模板市场：GitHub Discussions 集成 | 文档 + GitHub 配置 | 简单 | 1h |
| 导出 PDF / 图片预览页面 | `client/src/components/` | 中等 | 3-5h |
| 超时自动重试 | `server/src/routes/llm.ts` | 简单 | 1-2h |

> 💡 提交 PR 前请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)，新功能建议先开 Issue 讨论。

---

## 📄 License

本项目采用 **MIT License** — 可自由使用、修改、商用、分发，无任何限制。

- ✅ 个人 / 企业免费商用
- ✅ 二次修改和衍生发布
- ✅ 私有化部署
- ❌ 无任何担保

当前技术栈全部兼容 MIT 协议，无 GPL 等传染性协议依赖。

---

## 🏆 核心卖点

> **🔒 本地私有化** — 代码和数据不上传第三方  
> **🎯 三端输出** — 一句话生成 HTML / React / Vue3  
> **🦙 本地大模型** — 支持 Ollama 离线运行，无需联网  
> **🐳 一键部署** — Docker 一行命令启动

---

<p align="center">
  Built with ❤️ for developers who want to build faster.<br>
  🌟 Star on GitHub — <a href="https://github.com/your-org/codepage">your-org/codepage</a><br>
  <sub>Made with ❤️ · MIT Licensed · Free for any use</sub>
</p>
