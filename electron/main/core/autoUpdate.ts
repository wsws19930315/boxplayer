import { app, dialog } from 'electron'
import { autoUpdater } from 'electron-updater'
import type { UpdateInfo } from 'electron-updater'
import is from 'electron-is'

type MessageBoxResult = {
  response: number
}

type UpdateDialog = {
  showMessageBox(options: Electron.MessageBoxOptions): Promise<MessageBoxResult>
}

type UpdateLogger = {
  info: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
}

type UpdateEmitter = {
  autoDownload: boolean
  autoInstallOnAppQuit: boolean
  allowPrerelease: boolean
  checkForUpdates: () => Promise<unknown> | unknown
  downloadUpdate: () => Promise<unknown> | unknown
  quitAndInstall: (isSilent?: boolean, isForceRunAfter?: boolean) => void
  on: (event: string, listener: (...args: any[]) => void) => UpdateEmitter
}

type UpdateControllerOptions = {
  updater: UpdateEmitter
  dialog: UpdateDialog
  logger: UpdateLogger
  currentVersion: string
  isPackaged: boolean
}

const UPDATE_CHECK_DELAY_MS = 8000

const normalizeReleaseNotes = (releaseNotes: UpdateInfo['releaseNotes']) => {
  if (!releaseNotes) return ''
  if (typeof releaseNotes === 'string') return releaseNotes
  return releaseNotes
    .map(item => item.note)
    .filter(Boolean)
    .join('\n')
}

export function createAutoUpdateController(options: UpdateControllerOptions) {
  const { updater, dialog, logger, currentVersion, isPackaged } = options
  let isChecking = false
  let isDownloading = false
  let hasPromptedAvailable = false

  updater.autoDownload = false
  updater.autoInstallOnAppQuit = false
  updater.allowPrerelease = currentVersion.includes('-')

  const checkForUpdates = async () => {
    if (!isPackaged) {
      logger.info('[auto-update] skip check in development')
      return
    }
    if (isChecking || isDownloading) return

    isChecking = true
    try {
      await updater.checkForUpdates()
    } catch (err) {
      logger.warn('[auto-update] check failed', err)
    } finally {
      isChecking = false
    }
  }

  updater.on('update-available', async (info: UpdateInfo) => {
    if (hasPromptedAvailable || isDownloading) return
    hasPromptedAvailable = true

    const releaseNotes = normalizeReleaseNotes(info.releaseNotes)
    const result = await dialog.showMessageBox({
      type: 'info',
      title: '发现新版本',
      message: `发现新版本 ${info.version}`,
      detail: releaseNotes || `当前版本：${currentVersion}`,
      buttons: ['立即下载', '稍后'],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
    })

    if (result.response !== 0) return

    isDownloading = true
    try {
      await updater.downloadUpdate()
    } catch (err) {
      isDownloading = false
      logger.error('[auto-update] download failed', err)
      await dialog.showMessageBox({
        type: 'error',
        title: '更新下载失败',
        message: '新版本下载失败，请稍后重试。',
        detail: err instanceof Error ? err.message : String(err),
        buttons: ['知道了'],
        noLink: true,
      })
    }
  })

  updater.on('update-downloaded', async (info: UpdateInfo) => {
    isDownloading = false
    const result = await dialog.showMessageBox({
      type: 'info',
      title: '更新已下载',
      message: `新版本 ${info.version} 已下载完成`,
      detail: '重启应用后将自动安装更新。',
      buttons: ['重启安装', '稍后'],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
    })

    if (result.response === 0) {
      updater.quitAndInstall(false, true)
    }
  })

  updater.on('update-not-available', () => {
    logger.info('[auto-update] no update available')
  })

  updater.on('download-progress', (progress: { percent?: number }) => {
    const percent = typeof progress.percent === 'number' ? progress.percent : 0
    logger.info(`[auto-update] download progress ${percent.toFixed(1)}%`)
  })

  updater.on('error', (err: unknown) => {
    isChecking = false
    isDownloading = false
    logger.warn('[auto-update] updater error', err)
  })

  return { checkForUpdates }
}

export function registerAutoUpdate() {
  if (is.mas()) return

  const controller = createAutoUpdateController({
    updater: autoUpdater,
    dialog,
    logger: console,
    currentVersion: app.getVersion(),
    isPackaged: app.isPackaged,
  })

  setTimeout(() => {
    void controller.checkForUpdates()
  }, UPDATE_CHECK_DELAY_MS)
}
