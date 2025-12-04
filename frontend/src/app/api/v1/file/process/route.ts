import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // 使用 Docker 内部服务名，在容器内部调用后端
    const backendUrl = process.env.INTERNAL_BACKEND_URL || 'http://backend:8000'

    // 获取原始FormData
    const formData = await request.formData()

    // Forward the request to the backend
    const response = await fetch(`${backendUrl}/api/v1/file/process`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      try {
        const errorData = await response.json()
        return Response.json(errorData, { status: response.status })
      } catch {
        return Response.json(
          {
            code: response.status,
            message: `文件处理失败 (${response.status})`,
            details: { status: response.status },
          },
          { status: response.status }
        )
      }
    }

    const data = await response.json()
    return Response.json(data)
  } catch (error: any) {
    console.error('File process proxy error:', error)
    return Response.json(
      {
        code: 500,
        message: '服务器代理错误',
        details: { error: error.message },
      },
      { status: 500 }
    )
  }
}
