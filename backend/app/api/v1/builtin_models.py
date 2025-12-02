"""
内置模型 API 路由
提供内置模型列表获取和聊天功能
"""
from fastapi import APIRouter, HTTPException, Header, Depends
from typing import Optional, Dict, Any, List
import httpx
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# 从环境变量读取配置
BUILTIN_MODEL_ENABLED = os.getenv("BUILTIN_MODEL_ENABLED", "true").lower() == "true"
BUILTIN_MODEL_BASE_URL = os.getenv("BUILTIN_MODEL_BASE_URL", "https://api.openai.com/v1")
BUILTIN_MODEL_API_KEY = os.getenv("BUILTIN_MODEL_API_KEY", "")
BUILTIN_MODEL_ACCESS_KEY = os.getenv("BUILTIN_MODEL_ACCESS_KEY", "")


def verify_access_key(x_access_key: Optional[str] = Header(None)) -> bool:
    """
    验证内置模型访问密钥
    """
    if not BUILTIN_MODEL_ENABLED:
        raise HTTPException(status_code=503, detail="内置模型功能未启用")
    
    if not BUILTIN_MODEL_ACCESS_KEY:
        raise HTTPException(status_code=500, detail="服务器未配置内置模型访问密钥")
    
    if not x_access_key:
        raise HTTPException(status_code=401, detail="缺少访问密钥")
    
    # 支持多个访问密钥（用逗号分隔）
    valid_keys = [k.strip() for k in BUILTIN_MODEL_ACCESS_KEY.split(",")]
    
    if x_access_key not in valid_keys:
        raise HTTPException(status_code=403, detail="访问密钥无效")
    
    return True


@router.get("/config")
async def get_builtin_config(
    authorized: bool = Depends(verify_access_key)
):
    """
    获取内置模型配置信息（不包含敏感信息）
    """
    return {
        "enabled": BUILTIN_MODEL_ENABLED,
        "base_url": BUILTIN_MODEL_BASE_URL,
        "provider": "builtin"
    }


@router.get("/models")
async def get_builtin_models(
    authorized: bool = Depends(verify_access_key)
):
    """
    获取内置模型列表
    从配置的 baseURL/v1/models 获取可用模型
    """
    if not BUILTIN_MODEL_API_KEY:
        raise HTTPException(status_code=500, detail="服务器未配置内置模型 API 密钥")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{BUILTIN_MODEL_BASE_URL}/models",
                headers={
                    "Authorization": f"Bearer {BUILTIN_MODEL_API_KEY}",
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code != 200:
                logger.error(f"获取内置模型列表失败: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"获取模型列表失败: {response.text}"
                )
            
            models_data = response.json()
            
            # 转换为前端期望的格式
            models = {}
            if "data" in models_data:
                for model in models_data["data"]:
                    model_id = model.get("id", "")
                    if model_id:
                        models[model_id] = {
                            "name": model_id,
                            "description": f"内置模型: {model_id}",
                            "api_type": "chat_completions",
                            "context_length": 128000,
                            "supports_vision": "vision" in model_id.lower() or "gpt-4" in model_id.lower(),
                            "supports_function_calling": True,
                            "supports_streaming": True,
                            "pricing": {
                                "input": 0.0,
                                "output": 0.0
                            }
                        }
            
            return {
                "provider": {
                    "id": "builtin",
                    "name": "内置模型",
                    "description": "站点提供的内置模型服务",
                    "supports_thinking": False
                },
                "models": models,
                "raw_response": models_data  # 保留原始响应供调试
            }
            
    except httpx.TimeoutException:
        logger.error("获取内置模型列表超时")
        raise HTTPException(status_code=504, detail="获取模型列表超时")
    except httpx.RequestError as e:
        logger.error(f"获取内置模型列表请求错误: {str(e)}")
        raise HTTPException(status_code=502, detail=f"请求错误: {str(e)}")
    except Exception as e:
        logger.error(f"获取内置模型列表失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"内部错误: {str(e)}")


@router.post("/validate")
async def validate_access_key(
    x_access_key: Optional[str] = Header(None)
):
    """
    验证访问密钥是否有效
    """
    try:
        verify_access_key(x_access_key)
        return {
            "valid": True,
            "message": "访问密钥有效"
        }
    except HTTPException as e:
        return {
            "valid": False,
            "message": e.detail
        }
