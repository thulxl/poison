# 毒药游戏部署指南

## 准备工作

在开始部署前，请确保您的电脑已安装以下软件：
- [Git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org/) (v14.0.0 或更高版本)
- [npm](https://www.npmjs.com/) (通常随Node.js一起安装)

## 部署步骤

### 1. 创建GitHub仓库

1. 访问 [GitHub](https://github.com/) 并登录您的账号
2. 点击右上角的 "+" 图标，选择 "New repository"
3. 填写仓库名称（例如 "poison-game"）
4. 添加可选的描述
5. 选择 "Public"（公共仓库）
6. 勾选 "Initialize this repository with a README"
7. 点击 "Create repository"

### 2. 准备本地项目

1. 将项目代码下载到本地
2. 使用VS Code或其他编辑器打开项目文件夹

### 3. 修改配置文件

1. 找到并打开 `vite.config.ts` 文件
2. 修改 `base` 属性为您的仓库名称：
   ```typescript
   export default defineConfig({
     base: '/您的仓库名称/', // 例如 '/poison-game/'
     // 其他配置...
   });
   ```

### 4. 初始化Git仓库并关联远程仓库

打开终端，执行以下命令：

```bash
# 初始化Git仓库
git init

# 添加所有文件到暂存区
git add .

# 提交更改
git commit -m "Initial commit"

# 关联远程仓库（替换为您的仓库URL）
git remote add origin https://github.com/您的用户名/您的仓库名称.git

# 推送到远程仓库
git push -u origin main
```

### 5. 安装依赖并部署

```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 部署到GitHub Pages
npm run deploy
```

### 6. 配置GitHub Pages

1. 进入您的GitHub仓库页面
2. 点击 "Settings" 选项卡
3. 在左侧导航栏中选择 "Pages"
4. 在 "Source" 部分，从下拉菜单中选择 "gh-pages" 分支
5. 点击 "Save"

## 访问您的网站

部署完成后，您的游戏将在以下URL可用：
`https://您的用户名.github.io/您仓库名称/`

## 常见问题排查

### 部署后页面空白

1. 确保 `vite.config.ts` 中的 `base` 属性设置正确
2.' 检查浏览器控制台是否有错误（按F12打开开发者工具）
3. 确认部署过程中没有错误信息

### 404错误

1. 检查GitHub Pages配置是否正确选择了gh-pages分支
2. 等待几分钟，部署可能需要时间生效
3. 确认仓库名称和用户名拼写正确

### 样式或脚本加载失败

1.' 确保文件路径使用相对路径
'. 检查 `vite.config.ts` 文件配置是否正确
3. 重新运行 `npm run build` 和 `npm run deploy` 命令

## 重新部署

当您对代码进行修改后，只需执行以下命令即可重新部署：'
```bash
git add .
git commit -m "描述您的更改"git push
npm run deploy







# 毒药游戏 - 本地运行指南

## 如何在本地运行项目

### 前提条件
- 安装 [Node.js](https://nodejs.org/) (v14 或更高版本)
- 安装 [pnpm](https://pnpm.io/) 或 npm (Node.js 自带)

### 步骤

1. **克隆仓库**（如果尚未克隆）
```bash
git clone https://github.com/你的用户名/你的仓库名.git
cd 你的仓库名
```

2. **安装依赖**
使用pnpm（推荐）:
```bash
pnpm install
```

或使用npm:
```bash
npm install
```

3. **启动本地开发服务器**
使用pnpm:
```bash
pnpm dev
```

或使用npm:
```bash
npm run dev
```

4. **访问应用**
服务器启动后，在浏览器中访问:
```
http://localhost:3000
```

### 常见问题

- **端口冲突**: 如果3000端口被占用，可以修改package.json中的"dev:client"脚本，更改端口号:
  ```json
  "dev:client": "vite --host --port 3001"
  ```

- **依赖安装失败**: 尝试清除npm缓存后重新安装:
  ```bash
  npm cache clean --force
  npm install
  ```

- **启动后白屏**: 检查控制台是否有错误，尝试删除node_modules并重新安装依赖