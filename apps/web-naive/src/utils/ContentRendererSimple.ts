import { preferences } from '@vben/preferences';

import MarkdownIt from 'markdown-it';

// 声明全局MathJax类型
declare global {
  interface Window {
    MathJax: any;
  }
}

/**
 * 渲染选项
 */
interface RenderOptions {
  /** 是否启用Markdown渲染 */
  enableMarkdown?: boolean;
  /** 是否启用数学公式渲染 */
  enableMath?: boolean;
  /** 字体大小 */
  fontSize?: number;
  /** 是否使用暗色主题 */
  darkMode?: boolean;
}

/**
 * 简化版内容渲染器
 *
 * 使用浏览器原生MathJax，避免服务器端渲染问题
 */
export class ContentRendererSimple {
  private initPromise: null | Promise<void> = null;
  private markdown: MarkdownIt;
  private mathJaxReady = false;

  constructor() {
    this.markdown = new MarkdownIt({
      html: true,
      breaks: true,
      linkify: true,
      typographer: true,
    });
  }

  /**
   * 检查内容是否包含Markdown语法
   */
  public static hasMarkdownSyntax(content: string): boolean {
    const markdownPatterns = [
      /^#{1,6}\s+/m, // 标题
      /\*\*.*?\**/, // 粗体
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
      // 尝试初始化MathJax
      if (enableMath) {
        try {
          await this.initializeMathJax();
        } catch (error) {
          console.warn(
            'MathJax initialization failed, continuing without math rendering:',
            error,
          );
        }
      }

      let processedContent = content;

      // 如果启用数学公式渲染且MathJax准备好了
      if (enableMath && this.mathJaxReady && window.MathJax) {
        processedContent = await this.processMathFormulas(processedContent, {
          fontSize,
          darkMode,
        });
      }

      // 处理Markdown
      if (enableMarkdown) {
        processedContent = this.markdown.render(processedContent);
      } else {
        // 如果不启用Markdown，至少处理换行符
        processedContent = processedContent.replaceAll('\n', '<br>');
      }

      return processedContent;
    } catch (error) {
      console.error('Content rendering failed:', error);
      // 回退到简单的换行处理
      return content.replaceAll('\n', '<br>');
    }
  }

  /**
   * 预热渲染器
   */
  public async warmup(): Promise<void> {
    try {
      await this.initializeMathJax();
    } catch (error) {
      console.warn('Warmup failed:', error);
    }
  }

  /**
   * 修复MathJax生成的SVG中的辅助性MML display属性问题
   */
  private fixAssistiveMmlDisplay(svgString: string, isBlock: boolean): string {
    // 修复mjx-assistive-mml中math标签的display属性
    // 当display="block"时会导致重复显示，需要改为"inline"
    if (isBlock) {
      // 对于块级公式，将辅助性MML的display属性改为inline以避免重复显示
      svgString = svgString.replaceAll(
        /<math([^>]*)\sdisplay="block"([^>]*)>/g,
        '<math$1 display="inline"$2>',
      );
      // 也处理可能没有引号的情况
      svgString = svgString.replaceAll(
        /<math([^>]*)\sdisplay=block([^>]*)>/g,
        '<math$1 display=inline$2>',
      );
    }
    return svgString;
  }

  /**
   * 初始化MathJax
   */
  private async initializeMathJax(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      // 如果MathJax已经存在且准备好了
      if (window.MathJax && window.MathJax.tex2svg) {
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
        options: {
          // 控制辅助性MML的生成
          menuOptions: {
            settings: {
              assistiveMml: true, // 启用辅助性MML
            },
          },
        },
        startup: {
          ready: () => {
            window.MathJax.startup.defaultReady();
            this.mathJaxReady = true;
            resolve();
          },
        },
      };

      // 检查是否已经有MathJax脚本
      const existingScript = document.querySelector('script[src*="mathjax"]');
      if (existingScript) {
        // 等待现有脚本加载完成
        const checkReady = () => {
          if (window.MathJax && window.MathJax.tex2svg) {
            this.mathJaxReady = true;
            resolve();
          } else {
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
        return;
      }

      // 动态加载MathJax脚本
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js';
      script.async = true;
      script.addEventListener('error', () => {
        reject(new Error('Failed to load MathJax'));
      });
      document.head.append(script);
    });

    return this.initPromise;
  }

  /**
   * 处理数学公式
   */
  private async processMathFormulas(
    content: string,
    options: { darkMode?: boolean; fontSize?: number } = {},
  ): Promise<string> {
    if (!window.MathJax || !window.MathJax.tex2svg) {
      return content;
    }

    let processedContent = content;

    try {
      // 处理块级公式 $$...$$
      processedContent = processedContent.replaceAll(
        /\$\$([\s\S]*?)\$\$/g,
        (match, mathContent) => {
          // 预检查公式是否能正确渲染
          const trimmedContent = mathContent.trim();
          if (!this.testMathFormula(trimmedContent, true)) {
            console.warn(
              'Block math formula failed pre-check:',
              trimmedContent,
            );
            return `<div class="math-block math-error" style="text-align: center; margin: 1em 0; color: red; border: 1px dashed red; padding: 10px;">
            <strong>数学公式语法错误</strong><br>
            <code>${trimmedContent}</code><br>
            <small>请检查LaTeX语法</small>
          </div>`;
          }

          try {
            const svg = window.MathJax.tex2svg(mathContent.trim(), {
              display: true,
            });
            let svgString = svg.outerHTML;

            // 修复辅助性MML的display属性问题
            svgString = this.fixAssistiveMmlDisplay(svgString, true);

            // 处理字体大小
            if (options.fontSize && options.fontSize !== 16) {
              const scale = options.fontSize / 16;
              svgString = svgString.replace(
                /<svg([^>]*)>/,
                `<svg$1 style="transform: scale(${scale}); transform-origin: center;">`,
              );
            }

            // 暗色模式 - 直接修改SVG颜色
            if (options.darkMode) {
              svgString = svgString.replace(
                /<svg([^>]*)>/,
                '<svg$1 style="color: white;">',
              );
              // 同时处理内部的path元素颜色
              svgString = svgString.replaceAll(
                'fill="currentColor"',
                'fill="white"',
              );
              svgString = svgString.replaceAll('fill="#000"', 'fill="white"');
            }

            return `<div class="math-block" style="text-align: center; margin: 1em 0;">${svgString}</div>`;
          } catch (error) {
            console.error('Failed to render block math:', mathContent, error);
            console.error('Original match:', match);
            console.error('Error details:', error);
            // 返回一个错误提示而不是原始LaTeX，避免重复显示
            return `<div class="math-block math-error" style="text-align: center; margin: 1em 0; color: red; border: 1px dashed red; padding: 10px;">
              <strong>数学公式渲染错误</strong><br>
              <code>${mathContent.trim()}</code><br>
              <small>${error instanceof Error ? error.message : 'Unknown error'}</small>
            </div>`;
          }
        },
      );

      // 处理行内公式 $...$（避免与块级公式冲突）
      processedContent = processedContent.replaceAll(
        /(?<!\$)\$([^$\n]+)\$(?!\$)/g,
        (match, mathContent) => {
          // 预检查公式是否能正确渲染
          const trimmedContent = mathContent.trim();
          if (!this.testMathFormula(trimmedContent, false)) {
            console.warn(
              'Inline math formula failed pre-check:',
              trimmedContent,
            );
            return `<span class="math-inline math-error" style="color: red; border: 1px dashed red; padding: 2px;">
            [语法错误: ${trimmedContent}]
          </span>`;
          }

          try {
            const svg = window.MathJax.tex2svg(mathContent.trim(), {
              display: false,
            });
            let svgString = svg.outerHTML;

            // 修复辅助性MML的display属性问题（行内公式通常不需要，但为了一致性）
            svgString = this.fixAssistiveMmlDisplay(svgString, false);

            // 处理字体大小
            if (options.fontSize && options.fontSize !== 16) {
              const scale = options.fontSize / 16;
              svgString = svgString.replace(
                /<svg([^>]*)>/,
                `<svg$1 style="transform: scale(${scale}); transform-origin: left center; vertical-align: middle;">`,
              );
            }

            // 暗色模式 - 直接修改SVG颜色
            if (options.darkMode) {
              svgString = svgString.replace(
                /<svg([^>]*)>/,
                '<svg$1 style="color: white; vertical-align: middle;">',
              );
              // 同时处理内部的path元素颜色
              svgString = svgString.replaceAll(
                'fill="currentColor"',
                'fill="white"',
              );
              svgString = svgString.replaceAll('fill="#000"', 'fill="white"');
            }

            return `<span class="math-inline" style="display: inline-block; vertical-align: middle;">${svgString}</span>`;
          } catch (error) {
            console.error('Failed to render inline math:', mathContent, error);
            console.error('Original match:', match);
            console.error('Error details:', error);
            // 返回一个错误提示而不是原始LaTeX，避免重复显示
            return `<span class="math-inline math-error" style="color: red; border: 1px dashed red; padding: 2px;">
              [数学公式错误: ${mathContent.trim()}]
            </span>`;
          }
        },
      );
    } catch (error) {
      console.error('Math processing failed:', error);
    }

    return processedContent;
  }

  /**
   * 测试单个数学公式是否能正确渲染
   */
  private testMathFormula(mathContent: string, isBlock: boolean): boolean {
    try {
      if (!window.MathJax || !window.MathJax.tex2svg) {
        return false;
      }
      const svg = window.MathJax.tex2svg(mathContent.trim(), {
        display: isBlock,
      });
      return svg && svg.outerHTML && svg.outerHTML.length > 0;
    } catch (error) {
      console.warn(`Math formula test failed: ${mathContent}`, error);
      return false;
    }
  }
}

// 创建全局单例实例
let globalRenderer: ContentRendererSimple | null = null;

/**
 * 获取全局内容渲染器实例
 */
export function getContentRenderer(): ContentRendererSimple {
  if (!globalRenderer) {
    globalRenderer = new ContentRendererSimple();
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
