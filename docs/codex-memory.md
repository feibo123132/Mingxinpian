# Codex Memory

## 2026-05-05 - 本地预览服务卡住复盘

这次在完成主题化代码后，配置测试和 `npm run build` 已经通过，但我继续反复尝试启动 Vite dev server 和静态预览服务，导致用户等待过久。

需要记住：

- 当代码测试和生产构建已经通过时，应该优先交付结果。
- 本项目在当前 Codex/Windows 沙箱里启动 Vite dev server 可能触发 `esbuild spawn EPERM`，这是环境权限问题，不应反复重试。
- `npm run dev`、`python -m http.server` 这类服务命令是常驻进程，必须短超时、一次尝试、及时止损。
- 如果预览服务启动失败，应明确说明“构建已通过，预览服务受沙箱限制未启动”，不要继续折腾后台进程。
- 后续在这个项目里：测试通过 + 构建通过 = 可以交付；dev server 不是必须完成项。
