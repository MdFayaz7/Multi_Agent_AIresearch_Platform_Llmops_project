import json
import logging
import sys
from datetime import datetime, timezone

class StructuredFormatter(logging.Formatter):
    """
    Format logs into JSON string for production log aggregators.
    """
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
        }
        
        # Merge extra context attributes passed to the logger
        if hasattr(record, "extra_info"):
            log_data.update(record.extra_info)
        elif hasattr(record, "__dict__"):
            # Automatically include any dynamic keys added via the 'extra' dict parameter
            standard_attrs = {
                'name', 'msg', 'args', 'levelname', 'levelno', 'pathname', 'filename',
                'module', 'exc_info', 'exc_text', 'stack_info', 'lineno', 'funcName',
                'created', 'msecs', 'relativeCreated', 'thread', 'threadName',
                'processName', 'process'
            }
            extra = {k: v for k, v in record.__dict__.items() if k not in standard_attrs}
            if extra:
                log_data.update(extra)
                
        return json.dumps(log_data)

def setup_logger(name: str = "nexus") -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    
    # Avoid duplicate handlers if setup_logger is called multiple times
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(StructuredFormatter())
        logger.addHandler(handler)
        
    return logger


logger = setup_logger("nexus")
