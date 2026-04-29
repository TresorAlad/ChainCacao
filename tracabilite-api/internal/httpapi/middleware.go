package httpapi

import (
	"fmt"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

func CORSMiddleware() gin.HandlerFunc {
	origins := strings.Split(os.Getenv("ALLOWED_ORIGINS"), ",")
	if len(origins) == 1 && origins[0] == "" {
		origins = []string{"*"}
	}
	allowed := map[string]bool{}
	for _, o := range origins {
		allowed[strings.TrimSpace(o)] = true
	}

	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if allowed["*"] || allowed[origin] {
			c.Header("Access-Control-Allow-Origin", origin)
			if origin == "" && allowed["*"] {
				c.Header("Access-Control-Allow-Origin", "*")
			}
			c.Header("Vary", "Origin")
		}
		c.Header("Access-Control-Allow-Headers", "Authorization, Content-Type")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS")
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}

func PublicVerifyRateLimitMiddleware(limitPerMinute int) gin.HandlerFunc {
	type bucket struct {
		windowStart int64
		count       int
	}
	var (
		mu      sync.Mutex
		buckets = map[string]bucket{}
	)
	return func(c *gin.Context) {
		ip := c.ClientIP()
		nowWindow := time.Now().Unix() / 60
		mu.Lock()
		b := buckets[ip]
		if b.windowStart != nowWindow {
			b = bucket{windowStart: nowWindow, count: 0}
		}
		b.count++
		buckets[ip] = b
		mu.Unlock()

		if b.count > limitPerMinute {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"error": "rate limit depassee"})
			return
		}
		c.Next()
	}
}

// PublicVerifyRateLimitRedis limite /verify avec Redis (cle par IP et fenetre 1 min).
func PublicVerifyRateLimitRedis(rdb *redis.Client, limitPerMinute int) gin.HandlerFunc {
	return func(c *gin.Context) {
		if rdb == nil {
			PublicVerifyRateLimitMiddleware(limitPerMinute)(c)
			return
		}
		ip := c.ClientIP()
		key := fmt.Sprintf("ratelimit:verify:%s:%d", ip, time.Now().Unix()/60)
		ctx := c.Request.Context()
		n, err := rdb.Incr(ctx, key).Result()
		if err != nil {
			c.Next()
			return
		}
		if n == 1 {
			_ = rdb.Expire(ctx, key, 70*time.Second).Err()
		}
		if n > int64(limitPerMinute) {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"error": "rate limit depassee"})
			return
		}
		c.Next()
	}
}
