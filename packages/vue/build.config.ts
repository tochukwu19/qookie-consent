import { defineBuildConfig } from 'unbuild'

// mkdist compiles the .vue SFCs and .ts files file-by-file (declarations via
// vue-tsc), mirroring how the Nuxt module was built.
export default defineBuildConfig({
  declaration: true,
  clean: true,
  entries: [
    { builder: 'mkdist', input: 'src', outDir: 'dist' },
  ],
  externals: ['vue', '@qookie/core'],
})
