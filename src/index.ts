#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { QiGua, SimpleJieGuaQi, ChuanTongJieGuaQi, YaoZhi } from "@liwenyi/iching-divination";

const server = new Server(
  {
    name: "iching-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 工具列表
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "divination",
        description: "易经占卜工具。支持随机起卦或指定六爻起卦,提供卦象解读",
        inputSchema: {
          type: "object",
          properties: {
            mode: {
              type: "string",
              enum: ["random", "manual"],
              description: "起卦模式: random(随机) 或 manual(手动指定六爻)",
              default: "random"
            },
            lines: {
              type: "array",
              items: {
                type: "number",
                enum: [6, 7, 8, 9]
              },
              minItems: 6,
              maxItems: 6,
              description: "手动模式下的六爻值(从下往上): 6=老阴, 7=少阳, 8=少阴, 9=老阳"
            },
            language: {
              type: "string",
              enum: ["zh", "en"],
              description: "解卦语言: zh(中文) 或 en(英文)",
              default: "zh"
            },
            interpreter: {
              type: "string",
              enum: ["simple", "traditional"],
              description: "解卦器类型: simple(简单) 或 traditional(传统)",
              default: "simple"
            }
          },
          required: []
        },
      },
    ],
  };
});

// 工具调用处理
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "divination") {
    const { mode = "random", lines, language = "zh", interpreter = "simple" } = request.params.arguments as {
      mode?: "random" | "manual";
      lines?: number[];
      language?: "zh" | "en";
      interpreter?: "simple" | "traditional";
    };

    try {
      // 选择解卦器
      const jieGuaQi = interpreter === "traditional" ? new ChuanTongJieGuaQi() : new SimpleJieGuaQi();
      const qigua = new QiGua(jieGuaQi);

      // 起卦
      if (mode === "manual") {
        if (!lines || lines.length !== 6) {
          throw new Error("手动模式需要提供6个爻值");
        }
        if (!lines.every(v => [6, 7, 8, 9].includes(v))) {
          throw new Error("爻值必须是 6, 7, 8, 9 之一");
        }
        qigua.shouDongQi(lines as [YaoZhi, YaoZhi, YaoZhi, YaoZhi, YaoZhi, YaoZhi]);
      } else {
        qigua.qi();
      }

      // 解卦
      qigua.jie(language as "zh" | "en");

      // 构造结果
      const result: any = {
        mode,
        language,
        interpreter,
        benGua: {
          name: language === "zh" ? qigua.benGua?.name : qigua.benGua?.englishName,
          binary: qigua.benGua?.binary,
          xu: qigua.benGua?.xu,
        },
        interpretation: {
          main: qigua.jieCi?.zhuYao,
        },
      };

      // 添加六爻详情
      const liuyao = qigua.getLiuYao();
      result.liuyao = liuyao.yaos.map(yao => ({
        position: yao.wei,
        value: yao.zhi,
        yinyang: yao.yinyang ? "阳" : "阴",
        isChanging: yao.isLao,
      }));

      // 变爻信息
      if (qigua.bianYaoWei.length > 0) {
        result.changingLines = {
          positions: qigua.bianYaoWei,
          interpretations: qigua.jieCi?.bianYaoCi || [],
        };
      }

      // 变卦信息
      if (qigua.bianGua) {
        result.bianGua = {
          name: language === "zh" ? qigua.bianGua.name : qigua.bianGua.englishName,
          binary: qigua.bianGua.binary,
          xu: qigua.bianGua.xu,
          interpretation: qigua.jieCi?.bianGuaCi,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `错误: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error(`未知工具: ${request.params.name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("易经卜卦 MCP 服务已启动");
}

main().catch((error) => {
  console.error("服务错误:", error);
  process.exit(1);
});
