import { execFileSync } from "node:child_process";
import type { Plugin, ViteDevServer } from "vite";

const BUILD_COMPILE_GUARD = Symbol.for("cloesce.build.compile.guard");

const getBuildGuard = (): Set<string> => {
  const scope = globalThis as typeof globalThis & {
    [BUILD_COMPILE_GUARD]?: Set<string>;
  };
  if (!scope[BUILD_COMPILE_GUARD]) {
    scope[BUILD_COMPILE_GUARD] = new Set<string>();
  }
  return scope[BUILD_COMPILE_GUARD];
};

const getNpxCommand = (): string => {
  if ("win32" === process.platform) {
    return "npx.cmd";
  }
  return "npx";
};

const runCompile = (root: string) => {
  const npx = getNpxCommand();
  execFileSync(npx, ["cloesce", "compile"], {
    cwd: root,
    env: process.env,
    stdio: "inherit",
  });
};

export const cloescePlugin = (): Plugin => {
  let root = process.cwd();
  let command: "build" | "serve" = "serve";
  let running = false;
  let queued = false;

  const compile = (onError: (error: unknown) => void, onSuccess?: () => void) => {
    if (running) {
      queued = true;
      return;
    }

    running = true;
    try {
      runCompile(root);
      onSuccess?.();
    } catch (error) {
      onError(error);
    } finally {
      running = false;
      if (queued) {
        queued = false;
        compile(onError, onSuccess);
      }
    }
  };

  const isCloesceSourceFile = (filePath: string) =>
    filePath.endsWith(".cloesce.ts") ||
    filePath.endsWith("cloesce.config.ts") ||
    filePath.endsWith("cloesce.config.json");

  const setupWatcher = (server: ViteDevServer) => {
    server.watcher.add([
      `${root}/**/*.cloesce.ts`,
      `${root}/cloesce.config.ts`,
      `${root}/cloesce.config.json`,
    ]);

    const recompile = (filePath: string) => {
      if (!isCloesceSourceFile(filePath)) {
        return;
      }
      compile(
        (error) => {
          server.config.logger.error(`[cloesce] compile failed: ${String(error)}`);
        },
        () => {
          server.ws.send({ type: "full-reload" });
        },
      );
    };

    server.watcher.on("change", recompile);
    server.watcher.on("unlink", recompile);
  };

  return {
    buildStart() {
      if ("build" !== command) {
        return;
      }
      const guard = getBuildGuard();
      if (guard.has(root)) {
        return;
      }

      compile(
        (error) => {
          this.error(`[cloesce] compile failed: ${String(error)}`);
        },
        () => {
          guard.add(root);
        },
      );
    },
    configResolved(config) {
      root = config.root;
      command = config.command;
    },
    configureServer(server) {
      compile((error) => {
        server.config.logger.error(`[cloesce] compile failed: ${String(error)}`);
      });
      setupWatcher(server);
    },
    enforce: "pre",
    name: "cloesce-compile",
  };
};
