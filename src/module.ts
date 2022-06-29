import { dirname } from "pathe";
import { defineNuxtModule, logger } from "@nuxt/kit";
import { generate, loadCodegenConfig } from "@graphql-codegen/cli";

interface ModuleOptions {
  devOnly: boolean;
  extensions: string[];
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: "nuxt-graphql-codegen",
    configKey: "graphqlCodegen",
  },
  defaults: {
    devOnly: false,
    extensions: [".graphql", ".gql"]
  },
  async setup({ devOnly }, nuxt) {
    // Run in development mode only
    if (devOnly && !nuxt.options.dev) {
      return;
    }
    // Load GraphQL Code Generator configuration from rootDir
    const { config, filepath } = await loadCodegenConfig({
      configFilePath: nuxt.options.rootDir,
    });
    const cwd = dirname(filepath);

    // Execute GraphQL Code Generator
    async function codegen() {
      try {
        const start = Date.now();
        await generate({ ...config, cwd }, true);
        const time = Date.now() - start;
        logger.success(`GraphQL Code Generator generated code in ${time}ms`);
      } catch (e: unknown) {
        logger.error(`GraphQL Code Generator configuration not found.`);
      }
    }

    // Configure hooks
    nuxt.hook("build:before", codegen);
    nuxt.hook("builder:watch", async (_event, path) => {
      if (config.extensions.some((ext) => path.endsWith(ext))) {
        await codegen();
      }
    });
  },
});
