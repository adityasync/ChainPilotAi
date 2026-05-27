from fastapi import HTTPException, status


class AppError(HTTPException):
    """Base application error with SRS-compliant envelope."""
    def __init__(self, code: str, message: str, status_code: int = 400, field: str | None = None):
        self.code = code
        self.field = field
        super().__init__(status_code=status_code, detail=message)


class NotFoundError(AppError):
    def __init__(self, resource: str, resource_id: int | str | None = None):
        msg = f"{resource} not found" if resource_id is None else f"{resource} {resource_id} not found"
        super().__init__(code="NOT_FOUND", message=msg, status_code=404)


class ForbiddenError(AppError):
    def __init__(self, message: str = "Access denied"):
        super().__init__(code="FORBIDDEN", message=message, status_code=403)


class UnauthorizedError(AppError):
    def __init__(self, message: str = "Could not validate credentials"):
        super().__init__(code="UNAUTHORIZED", message=message, status_code=401)


class ValidationError(AppError):
    def __init__(self, message: str, field: str | None = None):
        super().__init__(code="VALIDATION_ERROR", message=message, status_code=422, field=field)


class ConflictError(AppError):
    def __init__(self, message: str):
        super().__init__(code="CONFLICT", message=message, status_code=409)


class RateLimitError(AppError):
    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(code="RATE_LIMIT_EXCEEDED", message=message, status_code=429)


class ServiceUnavailableError(AppError):
    def __init__(self, message: str = "Service temporarily unavailable"):
        super().__init__(code="SERVICE_UNAVAILABLE", message=message, status_code=503)
