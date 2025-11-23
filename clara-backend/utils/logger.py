"""
Logging utility for Clara Backend
"""

import sys
from loguru import logger
from pathlib import Path
from config import settings


def setup_logger():
    """Configure and setup the application logger"""
    
    # Remove default logger
    logger.remove()
    
    # Console logger with colors
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
        level=settings.LOG_LEVEL,
        colorize=True,
    )
    
    # File logger with rotation
    log_path = Path(settings.LOG_FILE_PATH)
    log_path.parent.mkdir(parents=True, exist_ok=True)
    
    logger.add(
        settings.LOG_FILE_PATH,
        rotation=settings.LOG_ROTATION,
        retention=settings.LOG_RETENTION,
        level=settings.LOG_LEVEL,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function} - {message}",
        backtrace=True,
        diagnose=True,
    )
    
    return logger


def get_logger(name: str = None):
    """Get a logger instance with optional name"""
    if name:
        return logger.bind(name=name)
    return logger


# Initialize logger on module import
setup_logger()

