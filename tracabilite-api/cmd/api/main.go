package main

import (
	"log"
	"os"

	"github.com/joho/godotenv"
	"tracabilite-api/internal/actors"
	"tracabilite-api/internal/auth"
	"tracabilite-api/internal/batch"
	"tracabilite-api/internal/fabric"
	"tracabilite-api/internal/httpapi"
)

func main() {
	_ = godotenv.Load()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	actorService := actors.NewService()
	jwtService := auth.NewJWTService()
	fabricClient := fabric.NewInMemoryClient()
	batchService := batch.NewService(fabricClient, actorService)
	handler := httpapi.NewHandler(actorService, jwtService, batchService)
	router := httpapi.NewRouter(handler, jwtService)

	log.Printf("API tracabilite listening on :%s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("unable to start api: %v", err)
	}
}
