import { useState } from 'react'
import { X } from 'lucide-react'

interface Template {
  name: string
  label: string
  icon: string
  color: string
  code: string
}

const templates: Template[] = [
  {
    name: '流程图',
    label: 'graph TD',
    icon: '◇─→',
    color: '#007aff',
    code: `graph TD
A[开始] --> B{判断}
B --> C[处理]
B --> D[结束]`,
  },
  {
    name: '时序图',
    label: 'sequenceDiagram',
    icon: '↕↗',
    color: '#34c759',
    code: `sequenceDiagram
Alice->>John: 你好
John-->>Alice: 收到
Alice->>John: 最近怎么样？`,
  },
  {
    name: '饼图',
    label: 'pie',
    icon: '◔◕',
    color: '#ff9500',
    code: `pie title 占比
"苹果" : 45
"香蕉" : 30
"橘子" : 25`,
  },
  {
    name: '甘特图',
    label: 'gantt',
    icon: '▃▅█',
    color: '#5856d6',
    code: `gantt
dateFormat YYYY-MM-DD
section 阶段一
任务A: 2024-01-01, 7d
任务B: after 任务A, 5d`,
  },
  {
    name: '类图',
    label: 'classDiagram',
    icon: '⊞▭',
    color: '#ff2d55',
    code: `classDiagram
class Animal {
  +String name
  +run()
}
class Dog extends Animal {
  +bark()
}`,
  },
  {
    name: '状态图',
    label: 'stateDiagram-v2',
    icon: '◎→',
    color: '#af52de',
    code: `stateDiagram-v2
[*] --> 待审核
待审核 --> 通过
待审核 --> 驳回
通过 --> [*]
驳回 --> 待审核`,
  },
  {
    name: '思维导图',
    label: 'mindmap',
    icon: '⊟⊞',
    color: '#5ac8fa',
    code: `mindmap
root((项目))
  需求分析
  系统设计
  编码开发
  测试部署`,
  },
]

interface MermaidDialogProps {
  onInsert: (code: string) => void
  onClose: () => void
}

function MermaidDialog({ onInsert, onClose }: MermaidDialogProps) {
  const [activeTemplate, setActiveTemplate] = useState<Template>(templates[0])
  const [code, setCode] = useState(templates[0].code)

  const selectTemplate = (t: Template) => {
    setActiveTemplate(t)
    setCode(t.code)
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="bg-white dark:bg-[#1c1c1e] rounded-xl shadow-2xl border border-[#e5e5e5] dark:border-[#38383a] w-[640px] max-h-[560px] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e5e5] dark:border-[#38383a]">
          <span className="text-sm font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">插入图表</span>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center text-[#86868f] hover:bg-[#e5e5e5] dark:hover:bg-[#3a3a3c] rounded transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Visual template picker */}
          <div className="w-40 border-r border-[#e5e5e5] dark:border-[#38383a] overflow-y-auto py-2 flex-shrink-0">
            {templates.map(t => (
              <button
                key={t.name}
                onClick={() => selectTemplate(t)}
                className={`w-full text-left px-3 py-2.5 transition-all ${
                  activeTemplate.name === t.name
                    ? 'bg-[#007aff]/8'
                    : 'hover:bg-[#e5e5e5] dark:hover:bg-[#2c2c2e]'
                }`}
              >
                <div className={`w-full rounded-lg p-2.5 border transition-all ${
                  activeTemplate.name === t.name
                    ? 'border-[#007aff] dark:border-[#0a84ff] bg-white dark:bg-[#2c2c2e] shadow-sm'
                    : 'border-transparent'
                }`}>
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white mb-1.5"
                    style={{ backgroundColor: t.color }}
                  >
                    {t.icon}
                  </div>
                  <div className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">{t.name}</div>
                  <div className="text-[10px] text-[#aeaeb2] mt-0.5 font-mono">{t.label}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Code editor */}
          <div className="flex-1 p-3 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: activeTemplate.color }}
              />
              <span className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">{activeTemplate.name}</span>
              <span className="text-[10px] text-[#aeaeb2] font-mono">{activeTemplate.label}</span>
            </div>
            <textarea
              autoFocus
              value={code}
              onChange={e => setCode(e.target.value)}
              className="flex-1 w-full resize-none text-xs font-mono bg-[#f5f5f7] dark:bg-[#2c2c2e] border border-[#e5e5e5] dark:border-[#38383a] rounded-lg p-3 outline-none text-[#1d1d1f] dark:text-[#f5f5f7] focus:border-[#007aff] dark:focus:border-[#0a84ff] transition-colors leading-relaxed"
              placeholder="在此编辑图表代码..."
              spellCheck={false}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[#e5e5e5] dark:border-[#38383a]">
          <button onClick={onClose} className="px-3 py-1.5 text-xs rounded-lg bg-[#e5e5e5] dark:bg-[#3a3a3c] text-[#1d1d1f] dark:text-[#f5f5f7] hover:opacity-80 transition-opacity">
            取消
          </button>
          <button onClick={() => onInsert(code)} className="px-3 py-1.5 text-xs rounded-lg bg-[#007aff] text-white hover:bg-[#0066d6] transition-colors">
            插入
          </button>
        </div>
      </div>
    </div>
  )
}

export default MermaidDialog
