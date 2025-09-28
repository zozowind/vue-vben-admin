import { preferences } from '@vben/preferences';

import MarkdownIt from 'markdown-it';

// 声明全局MathJax类型
declare global {
  interface Window {
    MathJax: any;
  }
}

/**
 * 数学公式类型
 */
interface MathFormula {
  /** 原始公式文本 */
  original: string;
  /** 公式内容（不含分隔符） */
  content: string;
  /** 是否为块级公式 */
  isBlock: boolean;
  /** 在原文中的位置 */
  start: number;
  /** 在原文中的结束位置 */
  end: number;
  /** 占位符ID */
  placeholder: string;
}

/**
 * 渲染选项
 */
interface RenderOptions {
  /** 是否启用Markdown渲染 */
  enableMarkdown?: boolean;
  /** 是否启用数学公式渲染 */
  enableMath?: boolean;
  /** 字体大小（用于SVG缩放） */
  fontSize?: number;
  /** 是否使用暗色主题 */
  darkMode?: boolean;
}

/**
 * 内容渲染器类
 *
 * 功能：
 * 1. 识别和提取数学公式（行内和块级）
 * 2. 将数学公式渲染为SVG
 * 3. 处理Markdown内容
 * 4. 合并渲染结果
 */
export class ContentRenderer {
  private isInitialized = false;
  private markdown: MarkdownIt;
  private mathJaxReady = false;

  constructor() {
    this.initializeMarkdown();
  }

  /**
   * 检查内容是否包含Markdown语法
   */
  public static hasMarkdownSyntax(content: string): boolean {
    // 简单的Markdown语法检测
    const markdownPatterns = [
      /^#{1,6}\s+/m, // 标题
      /\*\*.*?\*\*/, // 粗体
      /\*.*?\*/, // 斜体
      /`.*?`/, // 行内代码
      /```[\s\S]*?```/, // 代码块
      /^\s*[-*+]\s+/m, // 无序列表
      /^\s*\d+\.\s+/m, // 有序列表
      /\[.*?\]\(.*?\)/, // 链接
      /!\[.*?\]\(.*?\)/, // 图片
    ];

    return markdownPatterns.some((pattern) => pattern.test(content));
  }

  /**
   * 检查内容是否包含数学公式
   */
  public static hasMathFormulas(content: string): boolean {
    return /\$\$[\s\S]*?\$\$|\$[^$\n]+\$/.test(content);
  }

  /**
   * 渲染内容
   *
   * @param content 原始内容
   * @param options 渲染选项
   * @returns 渲染后的HTML字符串
   */
  public async render(
    content: string,
    options: RenderOptions = {},
  ): Promise<string> {
    const {
      enableMarkdown = true,
      enableMath = true,
      fontSize = 16,
      darkMode = preferences.theme.mode === 'dark',
    } = options;

    if (!content) return '';

    try {
      await this.ensureInitialized();

      let processedContent = content;
      const mathPlaceholders: { [key: string]: string } = {};

      // 第一步：处理数学公式
      if (enableMath) {
        const formulas = this.extractMathFormulas(content);

        for (const formula of formulas) {
          // 渲染公式为SVG
          const svg = await this.renderMathToSvg(formula, {
            fontSize,
            darkMode,
          });

          // 用占位符替换原始公式
          processedContent = processedContent.replace(
            formula.original,
            formula.placeholder,
          );

          // 保存SVG内容
          mathPlaceholders[formula.placeholder] = svg;
        }
      }

      // 第二步：处理Markdown
      if (enableMarkdown) {
        processedContent = this.markdown.render(processedContent);
      } else {
        // 如果不启用Markdown，至少处理换行符
        processedContent = processedContent.replaceAll('\n', '<br>');
      }

      // 第三步：替换数学公式占位符
      if (enableMath) {
        for (const [placeholder, svg] of Object.entries(mathPlaceholders)) {
          processedContent = processedContent.replace(placeholder, svg);
        }
      }

      return processedContent;
    } catch (error) {
      console.error('Content rendering failed:', error);
      // 回退到简单的换行处理
      return content.replaceAll('\n', '<br>');
    }
  }

  /**
   * 预热渲染器（可选，用于提前初始化）
   */
  public async warmup(): Promise<void> {
    await this.ensureInitialized();
  }

  /**
   * 确保渲染器已初始化
   */
  private async ensureInitialized(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.initializeMathJax();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize renderer:', error);
      // 即使MathJax初始化失败，也标记为已初始化，以便继续处理Markdown
      this.isInitialized = true;
    }
  }

  /**
   * 识别和提取数学公式
   */
  private extractMathFormulas(content: string): MathFormula[] {
    const formulas: MathFormula[] = [];

    // 匹配块级公式 $$...$$
    const blockMathRegex = /\$\$([\s\S]*?)\$\$/g;
    let match;

    while ((match = blockMathRegex.exec(content)) !== null) {
      formulas.push({
        original: match[0],
        content: match[1].trim(),
        isBlock: true,
        start: match.index,
        end: match.index + match[0].length,
        placeholder: `__MATH_BLOCK_${formulas.length}__`,
      });
    }

    // 匹配行内公式 $...$（排除已经被块级公式匹配的部分）
    const inlineMathRegex = /(?<!\$)\$([^$\n]+)\$(?!\$)/g;
    let tempContent = content;

    // 先用占位符替换块级公式，避免冲突
    for (const formula of formulas) {
      tempContent = tempContent.replace(formula.original, formula.placeholder);
    }

    while ((match = inlineMathRegex.exec(tempContent)) !== null) {
      // 计算在原始内容中的实际位置
      let actualStart = match.index;
      let actualEnd = match.index + match[0].length;

      // 调整位置（考虑之前的占位符替换）
      for (const blockFormula of formulas) {
        if (blockFormula.start < actualStart) {
          const lengthDiff =
            blockFormula.original.length - blockFormula.placeholder.length;
          actualStart += lengthDiff;
          actualEnd += lengthDiff;
        }
      }

      formulas.push({
        original: match[0],
        content: match[1].trim(),
        isBlock: false,
        start: actualStart,
        end: actualEnd,
        placeholder: `__MATH_INLINE_${formulas.length}__`,
      });
    }

    // 按位置排序（从后往前，便于替换）
    return formulas.sort((a, b) => b.start - a.start);
  }

  /**
   * 初始化Markdown处理器
   */
  private initializeMarkdown(): void {
    this.markdown = new MarkdownIt({
      html: true,
      breaks: true,
      linkify: true,
      typographer: true,
    });
  }

  /**
   * 初始化MathJax（浏览器版本）
   */
  private async initializeMathJax(): Promise<void> {
    if (this.mathJaxReady) return;

    return new Promise((resolve, reject) => {
      try {
        // 如果MathJax已经存在，直接使用
        if (window.MathJax) {
          this.mathJaxReady = true;
          resolve();
          return;
        }

        // 配置MathJax
        window.MathJax = {
          tex: {
            inlineMath: [['$', '$']],
            displayMath: [['$$', '$$']],
            processEscapes: true,
            processEnvironments: true,
          },
          svg: {
            fontCache: 'local',
          },
          startup: {
            ready: () => {
              window.MathJax.startup.defaultReady();
              this.mathJaxReady = true;
              resolve();
            },
          },
        };

        // 动态加载MathJax脚本
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js';
        script.async = true;
        script.addEventListener('error', () => {
          reject(new Error('Failed to load MathJax'));
        });
        document.head.append(script);
      } catch (error) {
        console.error('Failed to initialize MathJax:', error);
        reject(error);
      }
    });
  }

  /**
   * 渲染单个数学公式为SVG
   */
  private async renderMathToSvg(
    formula: MathFormula,
    options: RenderOptions = {},
  ): Promise<string> {
    if (!this.mathJaxReady || !window.MathJax) {
      console.warn('MathJax not ready, returning original formula');
      return formula.original;
    }

    try {
      // 准备公式文本
      const mathText = formula.isBlock
        ? `\\displaystyle{${formula.content}}`
        : formula.content;

      // 使用MathJax转换为SVG
      const svg = window.MathJax.tex2svg(mathText, {
        display: formula.isBlock,
      });

      // 获取SVG字符串
      let svgString = svg.outerHTML;

      // 处理SVG样式
      if (options.fontSize && options.fontSize !== 16) {
        const scale = options.fontSize / 16;
        svgString = svgString.replace(
          /<svg([^>]*)>/,
          `<svg$1 style="transform: scale(${scale}); transform-origin: left center;">`,
        );
      }

      // 暗色模式支持 - 直接修改SVG颜色
      if (options.darkMode) {
        svgString = svgString.replace(
          /<svg([^>]*)>/,
          '<svg$1 style="color: white;">',
        );
        // 同时处理内部的path元素颜色
        svgString = svgString.replaceAll('fill="currentColor"', 'fill="white"');
        svgString = svgString.replaceAll('fill="#000"', 'fill="white"');
      }

      // 为块级公式添加居中样式
      if (formula.isBlock) {
        return `<div class="math-block" style="text-align: center; margin: 1em 0;">${svgString}</div>`;
      }

      return `<span class="math-inline">${svgString}</span>`;
    } catch (error) {
      console.error('Failed to render math formula:', formula.content, error);
      // 返回原始公式作为回退
      return formula.original;
    }
  }
}

// 创建全局单例实例
let globalRenderer: ContentRenderer | null = null;

/**
 * 获取全局内容渲染器实例
 */
export function getContentRenderer(): ContentRenderer {
  if (!globalRenderer) {
    globalRenderer = new ContentRenderer();
  }
  return globalRenderer;
}

/**
 * 便捷的内容渲染函数
 */
export async function renderContent(
  content: string,
  options: RenderOptions = {},
): Promise<string> {
  const renderer = getContentRenderer();
  return renderer.render(content, options);
}
