import { useState } from 'react'
import { X, Type, Maximize, Save, RotateCcw, WrapText, Hash } from 'lucide-react'

export interface EditorSettings {
  fontSize: number
  editorWidth: number
  autoSave: boolean
  autoSaveInterval: number
  showLineNumbers: boolean
  lineWrapping: boolean
}

const DEFAULT_SETTINGS: EditorSettings = {
  fontSize: 18,
  editorWidth: 800,
  autoSave: true,
  autoSaveInterval: 30,
  showLineNumbers: true,
  lineWrapping: true,
}

const SETTINGS_KEY = 'markdown-editor-settings'

export function loadSettings(): EditorSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
  } catch (e) {
    console.error('Failed to load settings:', e)
  }
  return DEFAULT_SETTINGS
}

export function saveSettings(settings: EditorSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch (e) {
    console.error('Failed to save settings:', e)
  }
}

interface SettingsPanelProps {
  settings: EditorSettings
  onChange: (settings: EditorSettings) => void
  onClose: () => void
}

function ResetBtn({ onReset, show }: { onReset: () => void; show: boolean }) {
  if (!show) return null
  return (
    <button
      onClick={onReset}
      className="w-5 h-5 flex items-center justify-center text-[#aeaeb2] hover:text-[#007aff] dark:hover:text-[#0a84ff] transition-colors"
      title="恢复默认"
    >
      <RotateCcw size={12} />
    </button>
  )
}

function SettingsPanel({ settings, onChange, onClose }: SettingsPanelProps) {
  const [localSettings, setLocalSettings] = useState<EditorSettings>(settings)

  const updateSetting = <K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) => {
    const updated = { ...localSettings, [key]: value }
    setLocalSettings(updated)
    onChange(updated)
  }

  const resetSetting = <K extends keyof EditorSettings>(key: K) => {
    updateSetting(key, DEFAULT_SETTINGS[key])
  }

  const resetAll = () => {
    setLocalSettings(DEFAULT_SETTINGS)
    onChange(DEFAULT_SETTINGS)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white dark:bg-[#1c1c1e] rounded-xl shadow-2xl border border-[#e5e5e5] dark:border-[#38383a] w-[420px] max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e5e5] dark:border-[#38383a]">
          <h2 className="text-sm font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">设置</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-[#86868f] hover:bg-[#e5e5e5] dark:hover:bg-[#2c2c2e] rounded-md transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Font Size */}
          <div className="bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl p-4 border border-[#e5e5e5] dark:border-[#38383a]">
            <div className="flex items-center gap-2 mb-2">
              <Type size={14} className="text-[#007aff] dark:text-[#0a84ff]" />
              <label className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">字体大小</label>
              <ResetBtn show={localSettings.fontSize !== DEFAULT_SETTINGS.fontSize} onReset={() => resetSetting('fontSize')} />
              <span className="text-xs text-[#86868f] ml-auto">{localSettings.fontSize}px</span>
            </div>
            <input
              type="range"
              min="12"
              max="28"
              step="1"
              value={localSettings.fontSize}
              onChange={e => updateSetting('fontSize', parseInt(e.target.value))}
              className="w-full h-1.5 bg-[#e5e5e5] dark:bg-[#38383a] rounded-full appearance-none cursor-pointer accent-[#007aff]"
            />
            <div className="flex justify-between text-[10px] text-[#aeaeb2] mt-1">
              <span>12px</span>
              <span>28px</span>
            </div>
          </div>

          {/* Editor Width */}
          <div className="bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl p-4 border border-[#e5e5e5] dark:border-[#38383a]">
            <div className="flex items-center gap-2 mb-2">
              <Maximize size={14} className="text-[#007aff] dark:text-[#0a84ff]" />
              <label className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">编辑器宽度</label>
              <ResetBtn show={localSettings.editorWidth !== DEFAULT_SETTINGS.editorWidth} onReset={() => resetSetting('editorWidth')} />
              <span className="text-xs text-[#86868f] ml-auto">{localSettings.editorWidth}px</span>
            </div>
            <input
              type="range"
              min="600"
              max="1200"
              step="50"
              value={localSettings.editorWidth}
              onChange={e => updateSetting('editorWidth', parseInt(e.target.value))}
              className="w-full h-1.5 bg-[#e5e5e5] dark:bg-[#38383a] rounded-full appearance-none cursor-pointer accent-[#007aff]"
            />
            <div className="flex justify-between text-[10px] text-[#aeaeb2] mt-1">
              <span>600px</span>
              <span>1200px</span>
            </div>
          </div>

          {/* Auto Save */}
          <div className="bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl p-4 border border-[#e5e5e5] dark:border-[#38383a]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Save size={14} className="text-[#007aff] dark:text-[#0a84ff]" />
                <label className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">自动保存</label>
                <ResetBtn show={localSettings.autoSave !== DEFAULT_SETTINGS.autoSave} onReset={() => resetSetting('autoSave')} />
              </div>
              <button
                onClick={() => updateSetting('autoSave', !localSettings.autoSave)}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  localSettings.autoSave ? 'bg-[#007aff]' : 'bg-[#e5e5e5] dark:bg-[#38383a]'
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${
                    localSettings.autoSave ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Auto Save Interval */}
            {localSettings.autoSave && (
              <div className="mt-3 pt-3 border-t border-[#e5e5e5] dark:border-[#38383a]">
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-xs text-[#86868f]">保存间隔</label>
                  <ResetBtn show={localSettings.autoSaveInterval !== DEFAULT_SETTINGS.autoSaveInterval} onReset={() => resetSetting('autoSaveInterval')} />
                </div>
                <div className="flex gap-2">
                  {[5, 15, 30, 60].map(interval => (
                    <button
                      key={interval}
                      onClick={() => updateSetting('autoSaveInterval', interval)}
                      className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${
                        localSettings.autoSaveInterval === interval
                          ? 'bg-[#007aff] text-white'
                          : 'bg-white dark:bg-[#1c1c1e] text-[#86868f] hover:bg-[#e5e5e5] dark:hover:bg-[#3a3a3c] border border-[#e5e5e5] dark:border-[#38383a]'
                      }`}
                    >
                      {interval}s
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Show Line Numbers */}
          <div className="bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl p-4 border border-[#e5e5e5] dark:border-[#38383a]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash size={14} className="text-[#007aff] dark:text-[#0a84ff]" />
                <label className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">显示行号</label>
                <ResetBtn show={localSettings.showLineNumbers !== DEFAULT_SETTINGS.showLineNumbers} onReset={() => resetSetting('showLineNumbers')} />
              </div>
              <button
                onClick={() => updateSetting('showLineNumbers', !localSettings.showLineNumbers)}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  localSettings.showLineNumbers ? 'bg-[#007aff]' : 'bg-[#e5e5e5] dark:bg-[#38383a]'
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${
                    localSettings.showLineNumbers ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Line Wrapping */}
          <div className="bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl p-4 border border-[#e5e5e5] dark:border-[#38383a]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <WrapText size={14} className="text-[#007aff] dark:text-[#0a84ff]" />
                <label className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">自动换行</label>
                <ResetBtn show={localSettings.lineWrapping !== DEFAULT_SETTINGS.lineWrapping} onReset={() => resetSetting('lineWrapping')} />
              </div>
              <button
                onClick={() => updateSetting('lineWrapping', !localSettings.lineWrapping)}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  localSettings.lineWrapping ? 'bg-[#007aff]' : 'bg-[#e5e5e5] dark:bg-[#38383a]'
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${
                    localSettings.lineWrapping ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#e5e5e5] dark:border-[#38383a] flex items-center justify-between">
          <button
            onClick={resetAll}
            className="px-3 py-1.5 text-xs rounded-lg border border-[#e5e5e5] dark:border-[#38383a] text-[#86868f] hover:text-[#ff3b30] hover:border-[#ff3b30] transition-colors"
          >
            恢复默认
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs rounded-lg bg-[#007aff] text-white hover:bg-[#0066d6] transition-colors"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPanel
