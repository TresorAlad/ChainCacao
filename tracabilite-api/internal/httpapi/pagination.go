package httpapi

import (
	"strconv"

	"github.com/gin-gonic/gin"
)

type paginationParams struct {
	Page  int
	Limit int
}

func parsePagination(c *gin.Context, defaultLimit, maxLimit int) paginationParams {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", strconv.Itoa(defaultLimit)))
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = defaultLimit
	}
	if limit > maxLimit {
		limit = maxLimit
	}
	return paginationParams{Page: page, Limit: limit}
}

func paginateSlice[T any](items []T, page, limit int) ([]T, int) {
	total := len(items)
	start := (page - 1) * limit
	if start >= total {
		return []T{}, total
	}
	end := start + limit
	if end > total {
		end = total
	}
	return items[start:end], total
}
