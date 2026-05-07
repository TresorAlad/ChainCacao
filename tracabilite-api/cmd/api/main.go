package main

import (
	"context"
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
	"tracabilite-api/internal/actors"
	"tracabilite-api/internal/auth"
	"tracabilite-api/internal/batch"
	"tracabilite-api/internal/config"
	"tracabilite-api/internal/db"
	"tracabilite-api/internal/fabric"
	"tracabilite-api/internal/httpapi"
	"tracabilite-api/internal/incidents"
	"tracabilite-api/internal/media"
	"tracabilite-api/internal/syncdedup"
)

func main() {
	_ = godotenv.Load()
	ctx := context.Background()

	// Securite: en production, interdire un JWT_SECRET absent ou par defaut.
	if os.Getenv("APP_ENV") == "production" {
		secret := os.Getenv("JWT_SECRET")
		if secret == "" || secret == "change-me-in-production" {
			log.Fatal("JWT_SECRET requis en production")
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	var (
		actorStore actors.Store
		mediaRepo  *media.Repo
		cfgRepo    config.Repo
		incRepo    incidents.Repo
		dedupRepo  syncdedup.Repo
	)

	if os.Getenv("DATABASE_URL") != "" {
		pool, err := db.ConnectPool(ctx)
		if err != nil {
			log.Fatalf("postgres: %v", err)
		}
		defer pool.Close()
		if err := db.Migrate(ctx, pool); err != nil {
			log.Fatalf("migrate: %v", err)
		}
		if err := actors.SeedDemoPasswordsForPG(ctx, pool); err != nil {
			log.Printf("avertissement seed mots de passe demo: %v", err)
		}
		actorStore = actors.NewPGStore(pool)
		mediaRepo = media.NewRepo(pool)
		cfgRepo = config.NewPGRepo(pool)
		incRepo = incidents.NewPGRepo(pool)
		dedupRepo = syncdedup.NewPGRepo(pool)
	} else {
		actorStore = actors.NewMemoryStore()
		if err := actors.InitMemoryWebPasswords(actorStore); err != nil {
			log.Fatalf("memoire init web: %v", err)
		}
		log.Print("DATABASE_URL absente: acteurs en memoire (demo)")
		cfgRepo = config.NewMemoryRepo()
		incRepo = incidents.NewMemoryRepo()
		dedupRepo = syncdedup.NewMemoryRepo()
	}

	actorService := actors.NewService(actorStore)
	jwtService := auth.NewJWTService()

	fc, err := fabric.NewClientFromEnv()
	if err != nil {
		log.Fatalf("fabric: %v", err)
	}

	batchService := batch.NewService(fc, actorService)

	var rdb *redis.Client
	if u := os.Getenv("REDIS_URL"); u != "" {
		opt, err := redis.ParseURL(u)
		if err != nil {
			log.Printf("redis URL: %v", err)
		} else {
			rdb = redis.NewClient(opt)
			if err := rdb.Ping(ctx).Err(); err != nil {
				log.Printf("redis ping: %v (fallback rate limit memoire)", err)
				_ = rdb.Close()
				rdb = nil
			}
		}
	}

	handler := httpapi.NewHandler(actorService, jwtService, batchService, mediaRepo, cfgRepo, incRepo, dedupRepo)
	router := httpapi.NewRouter(handler, jwtService, rdb)

	log.Printf("API ChainCacao ecoute sur :%s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
