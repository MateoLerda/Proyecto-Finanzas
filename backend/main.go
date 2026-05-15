package main

import (
	"os"

	"mis-finanzas/db"
	"mis-finanzas/handlers"
	"mis-finanzas/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	db.Init()
	handlers.InitOAuth()

	r := gin.Default()

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{frontendURL, "http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: false,
	}))

	// Rutas públicas (OAuth)
	auth := r.Group("/api/auth")
	{
		auth.GET("/google", handlers.GoogleLogin)
		auth.GET("/google/callback", handlers.GoogleCallback)
	}

	// Rutas protegidas
	api := r.Group("/api", middleware.Auth())
	{
		api.GET("/me", handlers.GetMe)

		api.GET("/transactions", handlers.GetTransactions)
		api.POST("/transactions", handlers.CreateTransaction)
		api.DELETE("/transactions/:id", handlers.DeleteTransaction)

		api.GET("/budgets", handlers.GetBudgets)
		api.POST("/budgets", handlers.SaveBudget)
		api.DELETE("/budgets/:id", handlers.DeleteBudget)

		api.GET("/goals", handlers.GetGoals)
		api.POST("/goals", handlers.CreateGoal)
		api.PUT("/goals/:id", handlers.UpdateGoal)
		api.DELETE("/goals/:id", handlers.DeleteGoal)

		api.GET("/debts", handlers.GetDebts)
		api.POST("/debts", handlers.CreateDebt)
		api.PUT("/debts/:id", handlers.UpdateDebt)
		api.DELETE("/debts/:id", handlers.DeleteDebt)
	}

	// Rutas de admin
	admin := r.Group("/api/admin", middleware.Auth(), middleware.AdminOnly())
	{
		admin.GET("/users", handlers.AdminGetUsers)
		admin.PUT("/users/:id", handlers.AdminUpdateUser)
		admin.DELETE("/users/:id", handlers.AdminDeleteUser)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	r.Run(":" + port)
}
