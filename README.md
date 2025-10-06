# 易经卜卦 MCP 服务

基于 [iching-divination](https://www.npmjs.com/package/iching-divination) 实现的 MCP 服务,为 AI 助手提供易经占卜能力。

## 功能

- **随机起卦**: 模拟投掷铜钱起卦
- **手动起卦**: 指定六爻值起卦
- **双解卦器**: 简单解卦器 / 传统解卦器
- **中英双语**: 支持中文和英文解读

## 安装

```bash
npm install -g iching-mcp
```

## 配置 Claude Code

创建或编辑 `.mcp.json`:

```json
{
  "mcpServers": {
    "iching": {
      "command": "npx",
      "args": ["-y", "iching-mcp"]
    }
  }
}
```

## 使用示例

### 随机起卦
```json
{
  "mode": "random",
  "language": "zh",
  "interpreter": "simple"
}
```

### 手动起卦
```json
{
  "mode": "manual",
  "lines": [9, 9, 9, 9, 9, 9],
  "language": "zh",
  "interpreter": "traditional"
}
```

## 参数说明

- `mode`: 起卦模式
  - `random`: 随机起卦(默认)
  - `manual`: 手动指定六爻

- `lines`: 六爻值(从下往上)
  - `6`: 老阴(变爻)
  - `7`: 少阳
  - `8`: 少阴
  - `9`: 老阳(变爻)

- `language`: 解卦语言
  - `zh`: 中文(默认)
  - `en`: 英文

- `interpreter`: 解卦器
  - `simple`: 简单解卦器(默认)
  - `traditional`: 传统解卦器

## 输出结构

```typescript
{
  mode: string,           // 起卦模式
  language: string,       // 语言
  interpreter: string,    // 解卦器类型
  benGua: {              // 本卦
    name: string,        // 卦名
    binary: string,      // 二进制表示
    xu: number           // 卦序
  },
  liuyao: [{            // 六爻详情
    position: number,   // 爻位
    value: number,      // 爻值
    yinyang: string,    // 阴阳
    isChanging: boolean // 是否变爻
  }],
  interpretation: {      // 解读
    main: string        // 主要解读
  },
  changingLines?: {     // 变爻(可选)
    positions: number[],
    interpretations: string[]
  },
  bianGua?: {           // 变卦(可选)
    name: string,
    binary: string,
    xu: number,
    interpretation: string
  }
}
```

## License

MIT
