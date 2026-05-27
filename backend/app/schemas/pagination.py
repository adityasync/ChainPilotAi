from pydantic import BaseModel
from typing import Generic, TypeVar, List

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    data: List[T]
    total: int
    page: int
    page_size: int


def paginate(query, page: int = 1, page_size: int = 20):
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return items, total
