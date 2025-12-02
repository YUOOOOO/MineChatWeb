'use client'

import { useState } from 'react'
import { useSettingsStore } from '@/store/settingsStore'
import { Input } from '@/components/ui/input'
import { ChevronDown, ChevronRight, Key, Server } from 'lucide-react'

export default function ApiSettings() {
  const { settings, updateSettings } = useSettingsStore()
  const [showOpenAIProxy, setShowOpenAIProxy] = useState(false)
  const [validatingBuiltinKey, setValidatingBuiltinKey] = useState(false)
  const [builtinKeyStatus, setBuiltinKeyStatus] = useState<'valid' | 'invalid' | null>(null)

  const providers = [
    { id: 'openai', name: 'OpenAI', description: 'ChatGPT, GPT-4, o1系列等模型（仅Responses API）' },
    { id: 'openai_compatible', name: 'OpenAI兼容', description: '自定义OpenAI兼容API（支持Chat Completions API）' },
    { id: 'anthropic', name: 'Anthropic', description: 'Claude系列模型' },
    { id: 'google', name: 'Google', description: 'Gemini系列模型' },
    { id: 'azure', name: 'Azure OpenAI', description: '微软Azure OpenAI服务' },
    { id: 'deepseek', name: 'DeepSeek', description: 'DeepSeek模型' },
    { id: 'moonshot', name: 'Moonshot', description: 'Kimi模型' }
  ]

  const handleApiKeyChange = (provider: string, value: string) => {
    updateSettings({
      apiKeys: {
        ...settings.apiKeys,
        [provider]: value
      }
    })
  }

  const handleBaseUrlChange = (value: string) => {
    updateSettings({
      openaiCompatibleConfig: {
        ...settings.openaiCompatibleConfig,
        baseUrl: value
      }
    })
  }

  const handleOpenAIProxyChange = (value: string) => {
    updateSettings({
      openaiProxyUrl: value
    })
  }

  const handleApiKeyTypeChange = (type: 'custom' | 'builtin') => {
    updateSettings({
      apiKeyType: type
    })
    setBuiltinKeyStatus(null)
  }

  const handleBuiltinAccessKeyChange = (value: string) => {
    updateSettings({
      builtinModelAccessKey: value
    })
    setBuiltinKeyStatus(null)
  }

  // 验证内置模型访问密钥
  const validateBuiltinKey = async () => {
    if (!settings.builtinModelAccessKey) {
      setBuiltinKeyStatus('invalid')
      return
    }

    setValidatingBuiltinKey(true)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const response = await fetch(`${baseUrl}/api/v1/builtin-models/validate`, {
        method: 'POST',
        headers: {
          'X-Access-Key': settings.builtinModelAccessKey
        }
      })
      
      const data = await response.json()
      setBuiltinKeyStatus(data.valid ? 'valid' : 'invalid')
    } catch (error) {
      console.error('验证内置模型密钥失败:', error)
      setBuiltinKeyStatus('invalid')
    } finally {
      setValidatingBuiltinKey(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          API密钥设置
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          选择使用内置模型或自定义API密钥。所有密钥都保存在本地浏览器中，不会上传到服务器。
        </p>
      </div>

      {/* API密钥类型选择 */}
      <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg space-y-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          API密钥类型
        </label>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* 内置模型选项 */}
          <button
            type="button"
            onClick={() => handleApiKeyTypeChange('builtin')}
            className={`
              flex items-start gap-3 p-4 rounded-lg border-2 transition-all
              ${settings.apiKeyType === 'builtin'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }
            `}
          >
            <Server className={`w-5 h-5 mt-0.5 ${settings.apiKeyType === 'builtin' ? 'text-blue-600' : 'text-gray-400'}`} />
            <div className="text-left flex-1">
              <div className="font-medium text-gray-900 dark:text-white mb-1">内置模型</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                使用站点提供的内置模型服务
              </div>
            </div>
          </button>

          {/* 自定义API选项 */}
          <button
            type="button"
            onClick={() => handleApiKeyTypeChange('custom')}
            className={`
              flex items-start gap-3 p-4 rounded-lg border-2 transition-all
              ${settings.apiKeyType === 'custom'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }
            `}
          >
            <Key className={`w-5 h-5 mt-0.5 ${settings.apiKeyType === 'custom' ? 'text-blue-600' : 'text-gray-400'}`} />
            <div className="text-left flex-1">
              <div className="font-medium text-gray-900 dark:text-white mb-1">自定义API</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                使用您自己的API密钥
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 内置模型访问密钥输入 */}
      {settings.apiKeyType === 'builtin' && (
        <div className="space-y-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              内置模型访问密钥
            </label>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="请输入内置模型访问密钥"
                value={settings.builtinModelAccessKey || ''}
                onChange={(e) => handleBuiltinAccessKeyChange(e.target.value)}
                className="flex-1 px-3 py-2 text-sm font-mono border border-black/10 dark:border-white/10 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-black/30 dark:focus:border-white/30 transition-colors"
              />
              <button
                type="button"
                onClick={validateBuiltinKey}
                disabled={validatingBuiltinKey || !settings.builtinModelAccessKey}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {validatingBuiltinKey ? '验证中...' : '验证'}
              </button>
            </div>
            {builtinKeyStatus === 'valid' && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                ✓ 访问密钥有效
              </p>
            )}
            {builtinKeyStatus === 'invalid' && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                ✗ 访问密钥无效或已过期
              </p>
            )}
          </div>
          
          <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
              💡 关于内置模型
            </h4>
            <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
              <li>• 内置模型由站点管理员配置和维护</li>
              <li>• 您只需输入访问密钥即可使用</li>
              <li>• 无需配置API密钥和baseURL</li>
              <li>• 模型列表将自动从服务器获取</li>
            </ul>
          </div>
        </div>
      )}

      {/* 自定义API密钥输入 */}
      {settings.apiKeyType === 'custom' && (
        <div className="space-y-4">
          {providers.map((provider) => (
            <div key={provider.id} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {provider.name}
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {provider.description}
              </p>

              {/* OpenAI的自定义代理设置 */}
              {provider.id === 'openai' && (
                <div className="mb-2">
                  <button
                    type="button"
                    onClick={() => setShowOpenAIProxy(!showOpenAIProxy)}
                    className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                  >
                    {showOpenAIProxy ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                    自定义代理
                  </button>

                  {showOpenAIProxy && (
                    <div className="mt-2 space-y-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          代理URL
                        </label>
                        <Input
                          type="url"
                          placeholder="https://your-proxy.com"
                          value={settings.openaiProxyUrl || ''}
                          onChange={(e) => handleOpenAIProxyChange(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-black/10 dark:border-white/10 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-black/30 dark:focus:border-white/30 transition-colors"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          配置后将使用此代理地址替换 api.openai.com，留空则使用官方地址
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* OpenAI兼容提供商的额外设置 */}
              {provider.id === 'openai_compatible' && (
                <div className="space-y-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      基础URL
                    </label>
                    <Input
                      type="url"
                      placeholder="https://api.openai.com/v1"
                      value={settings.openaiCompatibleConfig?.baseUrl || ''}
                      onChange={(e) => handleBaseUrlChange(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-black/10 dark:border-white/10 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-black/30 dark:focus:border-white/30 transition-colors"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      设置OpenAI兼容API的基础URL
                    </p>
                  </div>
                </div>
              )}

              <Input
                type="password"
                placeholder={`请输入${provider.name} API Key`}
                value={settings.apiKeys[provider.id] || ''}
                onChange={(e) => handleApiKeyChange(provider.id, e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono border border-black/10 dark:border-white/10 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-black/30 dark:focus:border-white/30 transition-colors"
              />
            </div>
          ))}
        </div>
      )}

      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
          ⚠️ 安全提示
        </h4>
        <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
          <li>• API密钥仅保存在您的浏览器本地存储中</li>
          <li>• 请不要在公共设备上保存API密钥</li>
          <li>• 定期更换API密钥以确保安全</li>
          <li>• 如果怀疑密钥泄露，请立即在提供商处撤销</li>
        </ul>
      </div>
    </div>
  )
}