import * as fs from "node:fs";
import * as path from "node:path";
import { Logger } from "@nestjs/common";
import type { INestApplication } from "@nestjs/common";
import { SpelunkerModule } from "nestjs-spelunker";

const OUTPUT_FILE = path.resolve(process.cwd(), "deps.mermaid");

/**
 * Framework plumbing Nest injects into the container. Charting it buries the
 * application's own modules in noise.
 */
const FRAMEWORK_MODULES = new Set([
  "ConfigHostModule",
  "ConfigModule",
  "DiscoveryModule",
  "HttpModule",
  "InternalCoreModule",
  "JwtModule",
  "PassportModule",
  "SpelunkerModule",
  "ThrottlerModule"
]);

/**
 * Walks the live DI container and writes deps.mermaid.
 *
 * Runs on every bootstrap, so `nest start --watch` keeps the file in step with
 * the code: change a module's `imports` and the restart rewrites it.
 */
export function generateDependencyGraph(app: INestApplication): void {
  const logger = new Logger("DependencyGraph");

  try {
    const tree = SpelunkerModule.explore(app);
    const root = SpelunkerModule.graph(tree);
    const edges = SpelunkerModule.findGraphEdges(root);

    const mermaidEdges = [
      ...new Set(
        edges
          .map(({ from, to }) => ({
            from: from.module.name,
            to: to.module.name
          }))
          .filter(
            ({ from, to }) =>
              !FRAMEWORK_MODULES.has(from) && !FRAMEWORK_MODULES.has(to)
          )
          // Arrow runs dependency -> dependent: `to` is imported by `from`.
          //
          // The spaces around `-->` are load-bearing. Written tight as
          // `A-->B`, Mermaid can match its asymmetric-node rule (`id>text]`)
          // instead of the link rule, yielding a stray node called `A--` and
          // dropping the edge.
          .map(({ from, to }) => `  ${to} --> ${from}`)
      )
    ].sort();

    fs.writeFileSync(
      OUTPUT_FILE,
      `graph LR\n${mermaidEdges.join("\n")}\n`,
      "utf8"
    );

    logger.log(`deps.mermaid updated (${mermaidEdges.length} edges)`);
  } catch (error) {
    // Documentation output must never take the API down.
    logger.warn(
      `Could not generate deps.mermaid: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
