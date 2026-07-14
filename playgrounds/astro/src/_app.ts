import type { App } from 'vue'
import { qookie } from './qookie'

export default (app: App) => {
  app.use(qookie)
}
