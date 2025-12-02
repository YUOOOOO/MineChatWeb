'use client'

import { useEffect, useState } from 'react'
import { useSettingsStore } from '@/store/settingsStore'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { modelConfigService, ProviderConfig, ModelConfig } from '@/services/modelConfigService'

export default function ModelSettings() {
  const { settings, updateSettings } = useSettingsStore()
  const [providers, setProviders] = useState<Record<string, ProviderConfig>>({})
  const [models, setModels] = useState<Record<string, ModelConfig>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    // 根据 API 密钥类型加载提供商列表
    if (settings.apiKeyType === 'builtin') {
      fetchBuiltinModels()
    } else {
      fetchProviders()
    }
  }, [settings.apiKeyType, settings.builtinModelAccessKey])

  useEffect(() => {
    if (settings.apiKeyType === 'custom' && settings.chatProvider) {
      fetchModels(settings.chatProvider)
    }
  }, [settings.chatProvider, settings.apiKeyType])

  const fetchProviders = async () => {
    try {
      setLoading(true)
      setError('')
      const providersData = await modelConfigService.getProviders()
      setProviders(providersData)
    } catch (error) {
      console.error('获取提供商列表失败:', error)
      setError('获取提供商列表失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchModels = async (provider: string) => {
    try {
      setError('')
      const modelsData = await modelConfigService.getProviderModels(provider)
      setModels(modelsData)
    } catch (error) {
      console.error('获取模型列表失败:', error)
      setError('获取模型列表失败')
    }
  }

  const fetchBuiltinModels = async () => {
    if (!settings.builtinModelAccessKey) {
      setProviders({})
      setModels({})
      setError('请先在API设置中配置内置模型访问密钥')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const result = await modelConfigService.getBuiltinModels(settings.builtinModelAccessKey)
      
      if (!result) {
        setError('获取内置模型列表失败，请检查访问密钥是否正确')
        setProviders({})
        setModels({})
        return
      }

      // 设置内置模型提供商
      const builtinProvider = {
        builtin: result.provider
      }
      setProviders(builtinProvider)
      setModels(result.models)

      // 自动选择内置模型提供商
      if (settings.chatProvider !== 'builtin') {
        updateSettings({
          chatProvider: 'builtin',
          chatModel: ''
        })
      }
    } catch (error) {
      console.error('获取内置模型失败:', error)
      setError('获取内置模型失败')
      setProviders({})
      setModels({})
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    if (settings.apiKeyType === 'builtin') {
      fetchBuiltinModels()
    } else {
      fetchProviders()
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          模型设置
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {settings.apiKeyType === 'builtin' 
            ? '使用内置模型服务，模型列表从服务器自动获取。'
            : '选择用于对话、语音和图片功能的AI模型。'
          }
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* 内置模型信息提示 */}
      {settings.apiKeyType === 'builtin' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
            💡 内置模型模式
          </h4>
          <p className="text-xs text-blue-800 dark:text-blue-300">
            当前使用内置模型服务。模型列表将从服务器自动获取，无需配置额外的API密钥。
          </p>
        </div>
      )}

      {/* 对话模型设置 */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 dark:text-white">对话模型</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 提供商选择 - 内置模型时禁用 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              AI提供商
            </label>
            <Select
              value={settings.chatProvider || ''}
              onValueChange={(value) => {
                updateSettings({ chatProvider: value, chatModel: '' })
                if (settings.apiKeyType === 'custom') {
                  fetchModels(value)
                }
              }}
              disabled={settings.apiKeyType === 'builtin'}
            >
              <option value="">请选择提供商</option>
              {Object.entries(providers).map(([providerId, provider]) => (
                <option key={providerId} value={providerId}>
                  {provider.name}
                </option>
              ))}
            </Select>
            {settings.apiKeyType === 'builtin' && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                使用内置模型时提供商固定为"内置模型"
              </p>
            )}
          </div>

          {/* 模型选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              模型
            </label>
            <Select
              value={settings.chatModel || ''}
              onValueChange={(value) => updateSettings({ chatModel: value })}
              disabled={!settings.chatProvider || Object.keys(models).length === 0}
            >
              <option value="">请选择模型</option>
              {Object.entries(models).map(([modelId, modelConfig]) => (
                <option key={modelId} value={modelId}>
                  {modelConfig.name}
                </option>
              ))}
            </Select>
            {settings.chatProvider && Object.keys(models).length === 0 && !error && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                正在加载模型列表...
              </p>
            )}
          </div>
        </div>

        {/* 显示当前选中模型的详细信息 */}
        {settings.chatModel && models[settings.chatModel] && (
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
            <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              {models[settings.chatModel].name}
            </h5>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              {models[settings.chatModel].description}
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500 dark:text-gray-400">上下文长度:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {models[settings.chatModel].context_length.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">视觉支持:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {models[settings.chatModel].supports_vision ? '是' : '否'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">函数调用:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {models[settings.chatModel].supports_function_calling ? '是' : '否'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">流式输出:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {models[settings.chatModel].supports_streaming ? '是' : '否'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 刷新配置按钮 */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          {loading ? '刷新中...' : settings.apiKeyType === 'builtin' ? '刷新内置模型列表' : '刷新模型配置'}
        </Button>
      </div>
    </div>
  )
}