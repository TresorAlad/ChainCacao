package httpapi

import (
	"encoding/json"
	"expvar"
	"log"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

var (
	reqCount   = expvar.NewInt("http_requests_total")
	errCount   = expvar.NewInt("http_requests_errors_total")
	latencyMs  = expvar.NewInt("http_requests_latency_ms_total")
)

// RequestLogger ajoute un request_id et logge en JSON.
func RequestLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		rid := c.GetHeader("X-Request-Id")
		if rid == "" {
			rid = uuid.NewString()
		}
		c.Header("X-Request-Id", rid)
		c.Set("request_id", rid)

		start := time.Now()
		reqCount.Add(1)
		c.Next()
		dur := time.Since(start)
		latencyMs.Add(dur.Milliseconds())

		status := c.Writer.Status()
		if status >= 400 {
			errCount.Add(1)
		}

		line, _ := json.Marshal(gin.H{
			"ts":         time.Now().UTC().Format(time.RFC3339),
			"request_id": rid,
			"method":     c.Request.Method,
			"path":       c.FullPath(),
			"status":     status,
			"latency_ms": dur.Milliseconds(),
			"ip":         c.ClientIP(),
		})
		log.Print(string(line))
	}
}

