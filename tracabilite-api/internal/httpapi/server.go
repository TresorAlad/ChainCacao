package httpapi

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
)

// RunHTTPServer démarre Gin avec timeouts, graceful shutdown et mode release en production.
func RunHTTPServer(engine *gin.Engine, addr string) error {
	readSec := envIntDefault("HTTP_READ_TIMEOUT_SEC", 30)
	writeSec := envIntDefault("HTTP_WRITE_TIMEOUT_SEC", 60)
	idleSec := envIntDefault("HTTP_IDLE_TIMEOUT_SEC", 120)

	srv := &http.Server{
		Addr:         addr,
		Handler:      engine,
		ReadTimeout:  time.Duration(readSec) * time.Second,
		WriteTimeout: time.Duration(writeSec) * time.Second,
		IdleTimeout:  time.Duration(idleSec) * time.Second,
	}

	errCh := make(chan error, 1)
	go func() {
		log.Printf("API ChainCacao ecoute sur %s", addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			errCh <- err
		}
	}()

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	select {
	case <-ctx.Done():
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
		defer cancel()
		log.Print("arret graceful du serveur HTTP...")
		return srv.Shutdown(shutdownCtx)
	case err := <-errCh:
		return err
	}
}

func envIntDefault(key string, def int) int {
	raw := os.Getenv(key)
	if raw == "" {
		return def
	}
	n, err := strconv.Atoi(raw)
	if err != nil || n <= 0 {
		return def
	}
	return n
}
