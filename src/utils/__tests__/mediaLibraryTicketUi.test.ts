import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

describe('media library ticket regressions', () => {
  it('offers local metadata correction alongside AI rescraping', () => {
    const source = read('src/components/MediaLibrary.vue')

    expect(source).toContain('手动修改信息')
    expect(source).toContain('const saveManualMetadata = () =>')
    expect(source).toContain("metadataSource: 'manual'")
    expect(source).toContain('mediaStore.addMediaItem(updated)')
  })

  it('mounts the music sound-effect control in the player', () => {
    const source = read('src/layout/PageMusic.vue')

    expect(source).toContain("import SoundEffectBtn from '../components/SoundEffectBtn.vue'")
    expect(source).toContain('<SoundEffectBtn />')
  })

  it('keeps 115 root folders selectable and protects list requests from bursts', () => {
    const picker = read('src/pan/topbtns/SelectPanDirModal.vue')
    const list = read('src/cloud115/dirfilelist.ts')

    expect(picker).toContain('isDrive115User(userId)')
    expect(picker).toContain("file_id: driveType.key")
    expect(picker).toContain('isDir: true')
    expect(picker).toContain("const parentCid = key.includes('root') ? 0 : Number(key)")
    expect(list).toContain('const LIST_REQUEST_GAP_MS = 900')
    expect(list).toContain('const enqueueListRequest')
    expect(list).toContain("params.set('show_dir', showDir ? '1' : '0')")
  })

  it('opens cloud books through the provider-aware download proxy', () => {
    const source = read('src/layout/BookReaderModal.vue')

    expect(source).toContain("getRawUrl(book.user_id, book.drive_id, book.file_id")
    expect(source).toContain('return getProxyUrl({')
    expect(source).toContain('proxy_url: rawData.url')
  })
})
