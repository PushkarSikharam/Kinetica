from collections import defaultdict, deque
from threading import Lock
from time import time
from typing import Callable

from fastapi import Depends, HTTPException, status

from app.models.user import User
from app.core.security import get_current_user


class SlidingWindowRateLimiter:
    def __init__(self) -> None:
        self._events: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def enforce(self, key: str, limit: int, window_seconds: int) -> None:
        now = time()
        cutoff = now - window_seconds

        with self._lock:
            bucket = self._events[key]
            while bucket and bucket[0] <= cutoff:
                bucket.popleft()

            if len(bucket) >= limit:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded. Try again in {window_seconds} seconds.",
                )

            bucket.append(now)


rate_limiter = SlidingWindowRateLimiter()


def rate_limit_dependency(limit: int, window_seconds: int, scope: str) -> Callable:
    def dependency(current_user: User = Depends(get_current_user)) -> None:
        key = f"{scope}:{current_user.id}"
        rate_limiter.enforce(key=key, limit=limit, window_seconds=window_seconds)

    return dependency
